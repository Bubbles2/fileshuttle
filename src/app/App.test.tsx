import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../tests/axe';
import { TEST_API_KEY } from '../tests/constants';
import { createDataTransfer, csvFile, stubServer } from '../tests/fakeServer';
import { App } from './App';

const HEADER =
  'Skill,Category,Technology,Description,Copies,Distinct versions,Copies in worktree folders,Found in projects,Other names used in SKILL.md,Central copy';

const CSV = [
  HEADER,
  'clean-typescript,TypeScript / JavaScript tooling,TypeScript,"Write clean, correct TypeScript.",13,3,2,AgentSkill; codex/jde,,C:\\Skills\\clean-typescript',
  'web-security,Security and authentication,Web security,Enforce baseline web security.,13,3,2,AgentSkill,,C:\\Skills\\web-security',
  'docx,"Documents, design, AI and content","Word (.docx), Python",Create Word documents.,1,1,0,testClaude/ArcMobWord,word-docs,D:\\Shared\\docx',
  'linkedin-post,"Documents, design, AI and content",LinkedIn,Draft LinkedIn posts.,1,1,0,Claude Masterclass,,E:\\Old\\linkedin-post',
].join('\r\n');

const KINDS = {
  'C:\\Skills\\clean-typescript': 'folder',
  'C:\\Skills\\web-security': 'folder',
  'D:\\Shared\\docx': 'folder',
} as const;

/** A minimal inventory row: just a name, a description and a central copy. */
function row(name: string, centralCopy: string): string {
  return `${name},,,${name} description,,,,,,${centralCopy}`;
}

// StrictMode double-invokes effects and state updaters, surfacing impure logic.
function renderApp() {
  return render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('No file input');
  return input;
}

async function renderWithList(csv = CSV) {
  const user = userEvent.setup();
  const view = renderApp();
  await user.upload(fileInput(view.container), csvFile(csv));
  await screen.findByRole('button', { name: 'Add clean-typescript to the basket' });
  return { user, ...view };
}

/** Fields such as the destination start pre-filled, so clear them before typing. */
async function replaceText(user: ReturnType<typeof userEvent.setup>, field: HTMLElement, text: string) {
  await user.clear(field);
  await user.type(field, text);
}

function basket() {
  return screen.getByRole('list', { name: 'Skills to copy' });
}

function card(name: string) {
  return screen.getByRole('article', { name });
}

describe('App', () => {
  it('starts on the "Load CSV" step with an empty basket', async () => {
    stubServer({ kinds: {} });
    const { container } = renderApp();

    expect(screen.getByRole('heading', { level: 1, name: 'FileShuttle' })).toBeInTheDocument();
    expect(screen.getByText('No skills inventory loaded yet')).toBeInTheDocument();
    expect(screen.getByText('Load CSV').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Drag skills here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add skills or agents to copy/ })).toBeDisabled();
    await expectNoAxeViolations(container);
  });


  it('loads the CSV straight into the skills list without contacting the server', async () => {
    const server = stubServer({ kinds: {} });
    const { container } = await renderWithList();

    expect(screen.getByText('inventory_october.csv')).toBeInTheDocument();
    expect(screen.getByText('4 rows', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('4 skills')).toBeInTheDocument();
    for (const name of ['clean-typescript', 'web-security', 'docx', 'linkedin-post']) {
      expect(screen.getByRole('button', { name: `Add ${name} to the basket` })).toBeEnabled();
    }
    expect(server.fetchMock).not.toHaveBeenCalledWith('/api/inspect', expect.anything());
    await expectNoAxeViolations(container);
  });

  it('shows each skill with its description, and the tick reveals the rest of the record', async () => {
    stubServer({ kinds: KINDS });
    const { user, container } = await renderWithList();
    const skill = card('clean-typescript');

    expect(within(skill).getByText('Write clean, correct TypeScript.')).toBeInTheDocument();
    expect(within(skill).queryByText('Found in 2 projects')).not.toBeInTheDocument();

    await user.click(within(skill).getByRole('checkbox', { name: 'Show details' }));

    expect(within(skill).getByText('Found in 2 projects')).toBeInTheDocument();
    expect(within(skill).getByText('codex/jde')).toBeInTheDocument();
    expect(within(skill).getByText('13 copies · 3 distinct versions · 2 in worktree folders')).toBeInTheDocument();
    expect(within(skill).getByText('C:\\Skills\\clean-typescript')).toBeInTheDocument();
    await expectNoAxeViolations(container);

    await user.click(within(skill).getByRole('checkbox', { name: 'Show details' }));
    expect(within(skill).queryByText('Found in 2 projects')).not.toBeInTheDocument();
  });


  it('adds a skill with the round + in the corner of its card and marks it as in the basket', async () => {
    stubServer({ kinds: KINDS });
    const { user } = await renderWithList();

    await user.click(within(card('docx')).getByRole('button', { name: 'Add docx to the basket' }));

    expect(within(basket()).getByText('docx')).toBeInTheDocument();
    expect(within(card('docx')).getByText('docx is in the basket')).toBeInTheDocument();
    expect(within(card('docx')).queryByRole('button', { name: 'Add docx to the basket' })).not.toBeInTheDocument();
    expect(screen.getByText('Pick skills').closest('li')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Copy').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('adds a skill by dragging its card onto the basket', async () => {
    stubServer({ kinds: KINDS });
    await renderWithList();
    const dropTarget = screen.getByText('Drag skills here');
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(card('clean-typescript'), { dataTransfer });
    fireEvent.dragOver(dropTarget, { dataTransfer });
    fireEvent.drop(dropTarget, { dataTransfer });

    expect(within(basket()).getByText('clean-typescript')).toBeInTheDocument();
  });

  it('ignores drops that are not FileShuttle skills', async () => {
    stubServer({ kinds: KINDS });
    await renderWithList();
    const dataTransfer = createDataTransfer();
    dataTransfer.setData('text/plain', '1');

    fireEvent.drop(screen.getByText('Drag skills here'), { dataTransfer });

    expect(screen.getByText('Drag skills here')).toBeInTheDocument();
  });

  it('filters by name, description, category or technology', async () => {
    stubServer({ kinds: KINDS });
    const { user } = await renderWithList();
    const filter = screen.getByRole('searchbox', { name: 'Filter skills' });

    await user.type(filter, 'security');
    expect(screen.getByRole('article', { name: 'web-security' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'clean-typescript' })).not.toBeInTheDocument();

    await user.clear(filter);
    await user.type(filter, 'python');
    expect(screen.getByRole('article', { name: 'docx' })).toBeInTheDocument();

    await user.clear(filter);
    await user.type(filter, 'nothing like this');
    expect(screen.getByText('No skills match this filter.')).toBeInTheDocument();
  });


  it('adds all skills at once and clears the basket', async () => {
    stubServer({ kinds: KINDS });
    const { user } = await renderWithList();

    await user.click(screen.getByRole('button', { name: 'Add all available' }));
    expect(within(basket()).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Add all available' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Clear basket' }));
    expect(screen.getByText('Drag skills here')).toBeInTheDocument();
  });


  it('removes a single skill from the basket', async () => {
    stubServer({ kinds: KINDS });
    const { user } = await renderWithList();
    await user.click(screen.getByRole('button', { name: 'Add all available' }));

    await user.click(screen.getByRole('button', { name: 'Remove web-security from the basket' }));

    expect(within(basket()).queryByText('web-security')).not.toBeInTheDocument();
    expect(within(basket()).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Add web-security to the basket' })).toBeEnabled();
  });

  it('starts with the default destination and explains an invalid one', async () => {
    stubServer({ kinds: KINDS });
    const { user } = await renderWithList();
    await user.click(screen.getByRole('button', { name: 'Add clean-typescript to the basket' }));
    const destination = screen.getByLabelText('Destination folder');
    expect(destination).toHaveValue('C:\\Users\\D.Finlay\\SaveCrap');
    expect(screen.getByRole('button', { name: /Copy 1 skill to destination/ })).toBeEnabled();

    await replaceText(user, destination, 'Export\\Client');
    await user.tab();
    expect(screen.getByText('Enter a full path, such as D:\\Export\\Client.')).toBeInTheDocument();
    expect(destination).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: /Copy 1 skill to destination/ })).toBeDisabled();
  });

  it('shows where each basket skill is copied from, never the destination', async () => {
    stubServer({ kinds: KINDS });
    const { user } = await renderWithList();
    await user.click(screen.getByRole('button', { name: 'Add clean-typescript to the basket' }));

    expect(within(basket()).getByText('C:\\Skills\\clean-typescript')).toBeInTheDocument();
    expect(within(basket()).queryByText(/SaveCrap/)).not.toBeInTheDocument();
  });

  it('copies each skill folder with the chosen policy and reports the result', async () => {
    const server = stubServer({ kinds: KINDS });
    const { user, container } = await renderWithList();
    await user.click(screen.getByRole('button', { name: 'Add docx to the basket' }));
    await user.click(screen.getByRole('button', { name: 'Add clean-typescript to the basket' }));
    await replaceText(user, screen.getByLabelText('Destination folder'), 'D:\\MyProject\\.claude\\skills');
    await user.click(screen.getByRole('radio', { name: 'Keep both' }));

    await user.click(screen.getByRole('button', { name: 'Copy 2 skills to destination' }));

    expect(await screen.findByText('2 skills copied to')).toBeInTheDocument();
    expect(server.copyRequests).toEqual([
      { source: 'D:\\Shared\\docx', destination: 'D:\\MyProject\\.claude\\skills', policy: 'rename' },
      { source: 'C:\\Skills\\clean-typescript', destination: 'D:\\MyProject\\.claude\\skills', policy: 'rename' },
    ]);
    expect(within(basket()).getAllByText('Copied')).toHaveLength(2);
    expect(screen.getByRole('radio', { name: 'Skip' })).toBeDisabled();
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole('button', { name: 'Start a new batch' }));
    expect(screen.getByText('Drag skills here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add web-security to the basket' })).toBeEnabled();
  });

  it('starts a new batch when a skill is added after a copy has finished', async () => {
    stubServer({ kinds: KINDS });
    const { user } = await renderWithList();
    await user.click(screen.getByRole('button', { name: 'Add docx to the basket' }));
    await replaceText(user, screen.getByLabelText('Destination folder'), 'D:\\Out');
    await user.click(screen.getByRole('button', { name: 'Copy 1 skill to destination' }));
    await screen.findByText('1 skill copied to');

    await user.click(screen.getByRole('button', { name: 'Add web-security to the basket' }));

    expect(screen.queryByText('1 skill copied to')).not.toBeInTheDocument();
    expect(within(basket()).getAllByRole('listitem')).toHaveLength(1);
    expect(within(basket()).getByText('web-security')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy 1 skill to destination' })).toBeEnabled();
  });

  it('accepts a skill dropped anywhere on the basket card', async () => {
    stubServer({ kinds: KINDS });
    await renderWithList();
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(card('web-security'), { dataTransfer });
    fireEvent.dragOver(screen.getByRole('heading', { name: 'Copy basket' }), { dataTransfer });
    fireEvent.drop(screen.getByRole('heading', { name: 'Copy basket' }), { dataTransfer });

    expect(within(basket()).getByText('web-security')).toBeInTheDocument();
  });


  it('explains when a dropped skill is already in the basket', async () => {
    stubServer({ kinds: KINDS });
    await renderWithList();
    const heading = screen.getByRole('heading', { name: 'Copy basket' });
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(card('web-security'), { dataTransfer });
    fireEvent.drop(heading, { dataTransfer });
    fireEvent.drop(heading, { dataTransfer });

    expect(within(basket()).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('web-security is already in the basket.', { selector: 'p[aria-hidden]' })).toBeInTheDocument();
  });
  it('shows skipped and failed skills with their reasons', async () => {
    stubServer({
      kinds: KINDS,
      copy: ({ source }) =>
        source.endsWith('docx')
          ? { outcome: 'failed', message: 'Permission denied' }
          : { outcome: 'skipped', target: 'D:\\Out\\clean-typescript', message: 'Already exists in the destination' },
    });
    const { user } = await renderWithList();
    await user.click(screen.getByRole('button', { name: 'Add docx to the basket' }));
    await user.click(screen.getByRole('button', { name: 'Add clean-typescript to the basket' }));
    await replaceText(user, screen.getByLabelText('Destination folder'), 'D:\\Out');

    await user.click(screen.getByRole('button', { name: 'Copy 2 skills to destination' }));

    expect(await screen.findByText('0 skills copied to')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Permission denied')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    expect(screen.getByText(/1 skill skipped because it already existed · 1 failed/, { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/^Copy finished: 0 skills copied\./, { selector: 'p' })).toBeInTheDocument();
  });

  it('shows a progress state while copying', async () => {
    let finish: (() => void) | undefined;
    stubServer({
      kinds: KINDS,
      copy: () =>
        new Promise((resolve) => {
          finish = () => {
            resolve({ outcome: 'copied', target: 'D:\\Out\\x' });
          };
        }),
    });
    const { user } = await renderWithList();
    await user.click(screen.getByRole('button', { name: 'Add clean-typescript to the basket' }));
    await replaceText(user, screen.getByLabelText('Destination folder'), 'D:\\Out');

    await user.click(screen.getByRole('button', { name: 'Copy 1 skill to destination' }));

    expect(await screen.findByRole('button', { name: /Copying 1 skill/ })).toHaveAttribute('aria-disabled', 'true');
    expect(within(basket()).getByText('Copying…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose another CSV' })).toBeDisabled();
    await waitFor(() => {
      expect(finish).toBeDefined();
    });
    finish?.();
    expect(await screen.findByText('1 skill copied to')).toBeInTheDocument();
  });


  it('still loads the CSV when the server is not running, and says so', async () => {
    stubServer({ kinds: KINDS, offline: true });
    const user = userEvent.setup();
    const { container } = renderApp();

    expect(await screen.findByRole('heading', { name: 'FileShuttle’s server isn’t running' })).toBeInTheDocument();
    await user.upload(fileInput(container), csvFile(CSV));
    expect(await screen.findByRole('article', { name: 'clean-typescript' })).toBeInTheDocument();
    expect(screen.getByText('4 skills')).toBeInTheDocument();
  });

  it('warns straight away when the saved launch key is out of date', async () => {
    stubServer({ kinds: KINDS, rejectKey: true });
    const { container } = renderApp();

    expect(await screen.findByRole('heading', { name: 'Open FileShuttle from its launch link' })).toBeInTheDocument();
    expect(screen.getByText(/or has an old one/)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('picks the destination with the folder browser, starting from the typed path', async () => {
    stubServer({ kinds: KINDS, folders: { 'D:\\': ['Projects'], 'D:\\Projects': ['app'], 'D:\\Projects\\app': ['.claude'] } });
    const { user } = await renderWithList();
    await replaceText(user, screen.getByLabelText('Destination folder'), 'D:\\Projects');

    await user.click(screen.getByRole('button', { name: 'Browse… for the destination folder' }));
    const dialog = await screen.findByRole('dialog', { name: 'Choose the destination folder' });
    await user.click(await within(dialog).findByRole('button', { name: 'app' }));
    await user.click(await within(dialog).findByRole('button', { name: '.claude' }));
    await user.click(within(dialog).getByRole('button', { name: 'Up' }));
    expect(await within(dialog).findByText('D:\\Projects\\app')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Use this folder' }));

    expect(screen.getByLabelText('Destination folder')).toHaveValue('D:\\Projects\\app');
  });

  it('closes the folder browser without changing anything on Cancel', async () => {
    stubServer({ kinds: KINDS, folders: { 'C:\\': ['AI'] } });
    const { user } = await renderWithList();

    await user.click(screen.getByRole('button', { name: 'Browse… for the destination folder' }));
    const dialog = await screen.findByRole('dialog', { name: 'Choose the destination folder' });
    await user.click(within(dialog).getByRole('button', { name: 'Drives and home' }));
    await user.click(await within(dialog).findByRole('button', { name: 'C: drive' }));
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Destination folder')).toHaveValue('C:\\Users\\D.Finlay\\SaveCrap');
  });

  describe('CSV browser', () => {
    const WORKING = 'C:\\AI_Donncha\\fileshuttle';

    it('opens in the folder FileShuttle was started from, lists CSV files then folders, and loads the one picked', async () => {
      const server = stubServer({
        kinds: KINDS,
        workingFolder: WORKING,
        folders: { [WORKING]: ['sample-data'] },
        csvFiles: { [`${WORKING}\\AGENT_SKILL_INVENTORY.csv`]: CSV, [`${WORKING}\\sample-data\\other.csv`]: CSV },
      });
      const user = userEvent.setup();
      const { container } = renderApp();

      await user.click(screen.getByRole('button', { name: 'Choose a CSV' }));
      const dialog = await screen.findByRole('dialog', { name: 'Choose a skills CSV' });
      expect(await within(dialog).findByText(WORKING)).toBeInTheDocument();
      const list = within(dialog).getByRole('list', { name: 'Folders and CSV files' });
      expect(within(list).getAllByRole('button').map((button) => button.textContent)).toEqual(['AGENT_SKILL_INVENTORY.csv', 'sample-data']);
      expect(within(dialog).queryByRole('button', { name: 'Use this folder' })).not.toBeInTheDocument();
      await expectNoAxeViolations(container);

      await user.click(within(dialog).getByRole('button', { name: 'AGENT_SKILL_INVENTORY.csv' }));

      expect(await screen.findByRole('article', { name: 'clean-typescript' })).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('AGENT_SKILL_INVENTORY.csv')).toBeInTheDocument();
      expect(server.fetchMock).toHaveBeenCalledWith('/api/csv-file', expect.objectContaining({ body: JSON.stringify({ path: `${WORKING}\\AGENT_SKILL_INVENTORY.csv` }) }));

      // "Choose another CSV" opens in the working folder again, not where the last pick was made.
      await user.click(screen.getByRole('button', { name: 'Choose another CSV' }));
      const again = await screen.findByRole('dialog', { name: 'Choose a skills CSV' });
      expect(await within(again).findByText(WORKING)).toBeInTheDocument();
      // StrictMode mounts each dialog twice, so count distinct requests.
      const listRequests = server.fetchMock.mock.calls.filter(([url]) => url === '/api/folders').map(([, init]) => init?.body);
      expect(new Set(listRequests)).toEqual(new Set([JSON.stringify({ path: null, start: 'working-folder', files: 'csv' })]));
    });

    it('browses into sub-folders and back up, still showing only CSV files', async () => {
      stubServer({
        kinds: KINDS,
        workingFolder: WORKING,
        folders: { [WORKING]: ['sample-data'] },
        csvFiles: { [`${WORKING}\\sample-data\\SKILLS_INVENTORY_example.csv`]: CSV },
      });
      const user = userEvent.setup();
      renderApp();

      await user.click(screen.getByRole('button', { name: 'Choose a CSV' }));
      const dialog = await screen.findByRole('dialog', { name: 'Choose a skills CSV' });
      await user.click(await within(dialog).findByRole('button', { name: 'sample-data' }));
      await user.click(await within(dialog).findByRole('button', { name: 'SKILLS_INVENTORY_example.csv' }));

      expect(await screen.findByText('SKILLS_INVENTORY_example.csv')).toBeInTheDocument();
      expect(await screen.findByRole('article', { name: 'clean-typescript' })).toBeInTheDocument();
    });

    it('shows why a picked CSV could not be read', async () => {
      stubServer({ kinds: KINDS, workingFolder: WORKING, csvFiles: { [`${WORKING}\\locked.csv`]: null } });
      const user = userEvent.setup();
      renderApp();

      await user.click(screen.getByRole('button', { name: 'Choose a CSV' }));
      const dialog = await screen.findByRole('dialog', { name: 'Choose a skills CSV' });
      await user.click(await within(dialog).findByRole('button', { name: 'locked.csv' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('locked.csv: Permission denied');
    });

    it('can fall back to the system file dialog', async () => {
      stubServer({ kinds: KINDS, offline: true });
      const user = userEvent.setup();
      const { container } = renderApp();
      const input = fileInput(container);
      const openSystemDialog = vi.spyOn(input, 'click').mockImplementation(() => undefined);

      await user.click(screen.getByRole('button', { name: 'Choose a CSV' }));
      const dialog = await screen.findByRole('dialog', { name: 'Choose a skills CSV' });
      expect(await within(dialog).findByText(/Could not reach the FileShuttle server/)).toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: 'Use the system file dialog…' }));

      expect(openSystemDialog).toHaveBeenCalledOnce();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('rejects a CSV that is not a skills inventory', async () => {
    const server = stubServer({ kinds: KINDS });
    const user = userEvent.setup();
    const { container } = renderApp();

    await user.upload(fileInput(container), csvFile('description,location\nA,C:\\a.txt', 'wrong.csv'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Missing columns: Skill (or Agent), Central copy.');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(server.fetchMock).not.toHaveBeenCalledWith('/api/inspect', expect.anything());
  });

  it('reports rows skipped for having no central copy', async () => {
    stubServer({ kinds: KINDS });
    await renderWithList(`${CSV}\r\n${row('no-central-copy', '')}`);

    expect(screen.getByText(/1 row skipped/)).toBeInTheDocument();
  });


  it('lists skills whose central copies are relative paths, with no folder to choose first', async () => {
    stubServer({ kinds: {} });
    const user = userEvent.setup();
    const { container } = renderApp();

    await user.upload(fileInput(container), csvFile(`${HEADER}
${row('docx', 'central_skills\\skills\\docx')}`));

    expect(await screen.findByRole('button', { name: 'Add docx to the basket' })).toBeEnabled();
    expect(screen.queryByText(/base folder/i)).not.toBeInTheDocument();
  });

  it('copies relative central copies from the default Copy from folder', async () => {
    const server = stubServer({ kinds: {} });
    const user = userEvent.setup();
    const { container } = renderApp();
    await user.upload(fileInput(container), csvFile(`${HEADER}\r\n${row('docx', 'central_skills\\skills\\docx')}`));
    expect(screen.queryByLabelText('Copy from folder')).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Add docx to the basket' }));
    expect(screen.getByLabelText('Copy from folder')).toHaveValue('C:\\AI_Donncha\\fileshuttle\\');
    expect(within(basket()).getByText('C:\\AI_Donncha\\fileshuttle\\central_skills\\skills\\docx')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy 1 skill to destination' }));

    expect(await screen.findByText('1 skill copied to')).toBeInTheDocument();
    expect(server.copyRequests).toEqual([
      {
        source: 'C:\\AI_Donncha\\fileshuttle\\central_skills\\skills\\docx',
        destination: 'C:\\Users\\D.Finlay\\SaveCrap\\.claude\\skills',
        policy: 'skip',
      },
    ]);
  });

  it.each([
    ['C:\\AI_Donncha\\', 'C:\\AI_Donncha\\fileshuttle\\'],
    ['c:\\ai_donncha', 'C:\\AI_Donncha\\fileshuttle'],
    ['C:\\AI_Donncha\\central_skills\\skills', 'C:\\AI_Donncha\\fileshuttle\\central_skills\\skills'],
    ['C:\\AI_Donncha\\codex', 'C:\\AI_Donncha\\codex'],
    ['D:\\Library', 'D:\\Library'],
  ])('moves a remembered Copy from folder %s that pointed at the old central_skills place to %s', async (remembered, shown) => {
    localStorage.setItem('fileshuttle.sourceFolder', remembered);
    stubServer({ kinds: {} });
    const user = userEvent.setup();
    const { container } = renderApp();
    await user.upload(fileInput(container), csvFile(`${HEADER}\r\n${row('docx', 'central_skills\\skills\\docx')}`));
    await user.click(await screen.findByRole('button', { name: 'Add docx to the basket' }));

    expect(screen.getByLabelText('Copy from folder')).toHaveValue(shown);
  });

  it('copies into .claude\\skills when Claude is ticked, and .agents\\skills when it is not', async () => {
    const server = stubServer({ kinds: KINDS, folders: { 'D:\\': ['Projects'], 'D:\\Projects': [] } });
    const { user } = await renderWithList();
    await user.click(screen.getByRole('button', { name: 'Add docx to the basket' }));
    expect(screen.getByRole('checkbox', { name: 'Claude' })).toBeChecked();
    expect(screen.getByText('C:\\Users\\D.Finlay\\SaveCrap\\.claude\\skills')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Claude' }));
    expect(screen.getByText('C:\\Users\\D.Finlay\\SaveCrap\\.agents\\skills')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Browse… for the destination folder' }));
    const dialog = await screen.findByRole('dialog', { name: 'Choose the destination folder' });
    await user.click(within(dialog).getByRole('button', { name: 'Drives and home' }));
    await user.click(await within(dialog).findByRole('button', { name: 'D: drive' }));
    await user.click(await within(dialog).findByRole('button', { name: 'Projects' }));
    await within(dialog).findByText('D:\\Projects');
    await user.click(within(dialog).getByRole('button', { name: 'Use this folder' }));

    expect(screen.getByLabelText('Destination folder')).toHaveValue('D:\\Projects');
    expect(screen.getByText('D:\\Projects\\.agents\\skills')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy 1 skill to destination' }));
    expect(await screen.findByText('1 skill copied to')).toBeInTheDocument();
    expect(server.copyRequests[0]?.destination).toBe('D:\\Projects\\.agents\\skills');
  });

  it('accepts a Copy from folder that already includes the start of the path, and remembers it', async () => {
    const server = stubServer({ kinds: {} });
    const user = userEvent.setup();
    const { container } = renderApp();
    await user.upload(fileInput(container), csvFile(`${HEADER}\r\n${row('docx', 'central_skills\\skills\\docx')}`));
    await user.click(await screen.findByRole('button', { name: 'Add docx to the basket' }));

    await replaceText(user, screen.getByLabelText('Copy from folder'), 'C:\\AI_Donncha\\fileshuttle\\central_skills\\skills');
    await user.click(screen.getByRole('button', { name: 'Copy 1 skill to destination' }));

    expect(await screen.findByText('1 skill copied to')).toBeInTheDocument();
    expect(server.copyRequests[0]?.source).toBe('C:\\AI_Donncha\\fileshuttle\\central_skills\\skills\\docx');
    expect(localStorage.getItem('fileshuttle.sourceFolder')).toBe('C:\\AI_Donncha\\fileshuttle\\central_skills\\skills');
  });

  it('fills in the Mac folders when Mac is chosen, and leaves the Windows folders as they were', async () => {
    const server = stubServer({ kinds: {} });
    const user = userEvent.setup();
    const { container } = renderApp();
    await user.upload(fileInput(container), csvFile(`${HEADER}\r\n${row('docx', 'central_skills\\skills\\docx')}`));
    await user.click(await screen.findByRole('button', { name: 'Add docx to the basket' }));
    await replaceText(user, screen.getByLabelText('Destination folder'), 'D:\\Out');
    expect(screen.getByRole('radio', { name: 'Windows' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Mac' }));
    expect(screen.getByLabelText('Copy from folder')).toHaveValue('/Users/dcfinlay/Development/AI/fileshuttle/central_skills/');
    expect(screen.getByLabelText('Destination folder')).toHaveValue('/Users/dcfinlay/');
    expect(screen.getByText('/Users/dcfinlay/.claude/skills')).toBeInTheDocument();
    expect(localStorage.getItem('fileshuttle.sourceFolder')).toBeNull();

    await user.click(screen.getByRole('radio', { name: 'Windows' }));
    expect(screen.getByLabelText('Copy from folder')).toHaveValue('C:\\AI_Donncha\\fileshuttle\\');
    expect(screen.getByLabelText('Destination folder')).toHaveValue('D:\\Out');

    await user.click(screen.getByRole('radio', { name: 'Mac' }));
    await user.click(screen.getByRole('button', { name: 'Copy 1 skill to destination' }));
    expect(await screen.findByText('1 skill copied to')).toBeInTheDocument();
    expect(server.copyRequests).toEqual([
      {
        source: '/Users/dcfinlay/Development/AI/fileshuttle/central_skills/skills/docx',
        destination: '/Users/dcfinlay/.claude/skills',
        policy: 'skip',
      },
    ]);
  });

  it('lets keyboard users pick a conflict policy with the arrow keys', async () => {
    stubServer({ kinds: {} });
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('radio', { name: 'Skip' }));
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: 'Overwrite' })).toBeChecked();
    expect(screen.getByText('Existing files are replaced. Existing folders are merged.')).toBeInTheDocument();
  });

  it('keeps keyboard focus in place when skills are added, removed and cleared', async () => {
    stubServer({ kinds: KINDS });
    const { user } = await renderWithList();

    await user.click(screen.getByRole('button', { name: 'Add clean-typescript to the basket' }));
    expect(screen.getByRole('button', { name: 'Add web-security to the basket' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Add web-security to the basket' }));
    await user.click(screen.getByRole('button', { name: 'Remove clean-typescript from the basket' }));
    expect(screen.getByRole('button', { name: 'Remove web-security from the basket' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Clear basket' }));
    expect(screen.getByRole('heading', { name: 'Copy basket' })).toHaveFocus();
  });

  it('stops a copy part-way and reports what was not copied', async () => {
    const server = stubServer({ kinds: KINDS, copy: () => new Promise<never>(() => undefined) });
    const { user } = await renderWithList();
    await user.click(screen.getByRole('button', { name: 'Add clean-typescript to the basket' }));
    await user.click(screen.getByRole('button', { name: 'Add web-security to the basket' }));
    await replaceText(user, screen.getByLabelText('Destination folder'), 'D:\\Out');
    await user.click(screen.getByRole('button', { name: 'Copy 2 skills to destination' }));

    await user.click(await screen.findByRole('button', { name: 'Stop copying' }));

    expect(await screen.findByText('0 skills copied to')).toBeInTheDocument();
    expect(server.copyRequests).toHaveLength(1);
    expect(within(basket()).getAllByText('Stopped')).toHaveLength(2);
    expect(screen.getByText(/may be partly copied/)).toBeInTheDocument();
    expect(screen.getByText('Not copied')).toBeInTheDocument();
    expect(screen.getByText(/2 not copied because the copy was stopped/, { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start a new batch' })).toHaveFocus();
  });

  it('warns when two basket skills would land in the same folder name', async () => {
    const csv = [HEADER, row('shared-a', 'C:\\A\\shared-skill'), row('shared-b', 'D:\\B\\Shared-Skill')].join('\n');
    stubServer({ kinds: { 'C:\\A\\shared-skill': 'folder', 'D:\\B\\Shared-Skill': 'folder' } });
    const user = userEvent.setup();
    const { container } = renderApp();
    await user.upload(fileInput(container), csvFile(csv));
    await user.click(await screen.findByRole('button', { name: 'Add all available' }));

    expect(screen.getByText('Same name as item 1: it will be skipped')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Overwrite' }));
    expect(screen.getByText('Same name as item 1: it will replace that one')).toBeInTheDocument();
  });

  it('resets the basket and the filter when another CSV is loaded', async () => {
    stubServer({ kinds: KINDS });
    const { user, container } = await renderWithList();
    await user.click(screen.getByRole('button', { name: 'Add clean-typescript to the basket' }));
    await user.type(screen.getByRole('searchbox', { name: 'Filter skills' }), 'security');

    await user.upload(fileInput(container), csvFile(CSV, 'second.csv'));

    expect(await screen.findByText('second.csv')).toBeInTheDocument();
    expect(screen.getByText('Drag skills here')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Filter skills' })).toHaveValue('');
    expect(screen.getByRole('article', { name: 'clean-typescript' })).toBeInTheDocument();
  });

  it('ignores a drop of a skill from a previously loaded list', async () => {
    stubServer({ kinds: KINDS });
    const { user, container } = await renderWithList();
    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(card('clean-typescript'), { dataTransfer });

    await user.upload(fileInput(container), csvFile(CSV, 'second.csv'));
    await screen.findByText('second.csv');
    fireEvent.drop(screen.getByText('Drag skills here'), { dataTransfer });

    expect(screen.getByText('Drag skills here')).toBeInTheDocument();
  });

  it('sends the launch key with API calls', async () => {
    const server = stubServer({ kinds: KINDS });
    await renderWithList();

    const init = server.fetchMock.mock.calls[0]?.[1];
    expect(init?.headers).toMatchObject({ 'X-FileShuttle-Key': TEST_API_KEY });
    expect(screen.queryByText('Open FileShuttle from its launch link')).not.toBeInTheDocument();
  });

  it('works with no key at all when the server does not require one', async () => {
    localStorage.clear();
    const server = stubServer({ kinds: KINDS, folders: { 'C:\\': ['Projects'] } });
    const { user } = await renderWithList();

    await user.click(screen.getByRole('button', { name: 'Browse… for the destination folder' }));
    await user.click(await screen.findByRole('button', { name: 'Drives and home' }));
    expect(await screen.findByRole('button', { name: 'C: drive' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Open FileShuttle from its launch link' })).not.toBeInTheDocument();
    const healthCall = server.fetchMock.mock.calls.find(([url]) => url === '/api/health');
    expect(healthCall?.[1]?.headers).toEqual({});
  });

  it('explains how to connect when the server requires a key this browser lacks', async () => {
    localStorage.clear();
    stubServer({ kinds: {}, rejectKey: true });
    const { container } = renderApp();

    expect(await screen.findByRole('heading', { name: 'Open FileShuttle from its launch link' })).toBeInTheDocument();
    expect(screen.getByText(/--require-key/)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('ignores duplicate central copies and explains malformed quotes', async () => {
    stubServer({ kinds: KINDS });
    const { user, container } = await renderWithList(`${CSV}\r\n${row('clean-typescript-copy', 'c:\\skills\\CLEAN-TYPESCRIPT')}`);
    expect(screen.getByText(/1 duplicate central copy ignored/)).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'clean-typescript-copy' })).not.toBeInTheDocument();

    await user.upload(fileInput(container), csvFile(`${HEADER}\n"Broken,,,x,,,,,,C:\\a`, 'broken.csv'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Line 2 opens a quote that is never closed.');
  });

  describe('agents', () => {
    const MIXED = [
      'Skill,Type,Description,Central copy',
      'docx,S,Word files,C:\\Skills\\docx',
      'code-reviewer,A,Reviews code,C:\\Agents\\code-reviewer.md',
      'test-engineer,A,Writes tests,C:\\Agents\\test-engineer.md',
    ].join('\r\n');

    async function renderMixed() {
      const server = stubServer({ kinds: {} });
      const user = userEvent.setup();
      const { container } = renderApp();
      await user.upload(fileInput(container), csvFile(MIXED, 'AGENT_SKILL_INVENTORY.csv'));
      await screen.findByRole('article', { name: 'docx' });
      return { server, user };
    }

    it('switches between skills and agents with the A / S filter', async () => {
      const { user } = await renderMixed();
      expect(screen.getByRole('radio', { name: /Skills/ })).toBeChecked();
      expect(screen.queryByRole('article', { name: 'code-reviewer' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('radio', { name: /Agents/ }));

      expect(screen.getByRole('heading', { name: 'Agents' })).toBeInTheDocument();
      expect(screen.getByText('2 agents')).toBeInTheDocument();
      expect(screen.getByRole('article', { name: 'code-reviewer' })).toBeInTheDocument();
      expect(screen.queryByRole('article', { name: 'docx' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Add all available' }));
      expect(within(basket()).getAllByRole('listitem')).toHaveLength(2);
      expect(screen.getByRole('button', { name: 'Copy 2 agents to destination' })).toBeEnabled();
    });

    it('copies agents into .claude\\agents, or into .codex\\agents as .toml when Claude is unticked', async () => {
      const { server, user } = await renderMixed();
      await user.click(screen.getByRole('radio', { name: /Agents/ }));
      await user.click(screen.getByRole('button', { name: 'Add code-reviewer to the basket' }));
      expect(screen.getByText('C:\\Users\\D.Finlay\\SaveCrap\\.claude\\agents')).toBeInTheDocument();

      await user.click(screen.getByRole('checkbox', { name: 'Claude' }));
      expect(screen.getByText('C:\\Users\\D.Finlay\\SaveCrap\\.codex\\agents')).toBeInTheDocument();
      expect(screen.getByText(/Agents will be copied to \(as \.toml files\)/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Copy 1 agent to destination' }));
      expect(await screen.findByText('1 agent copied to')).toBeInTheDocument();
      expect(server.copyRequests).toEqual([
        {
          source: 'C:\\Agents\\code-reviewer.md',
          destination: 'C:\\Users\\D.Finlay\\SaveCrap\\.codex\\agents',
          policy: 'skip',
          targetName: 'code-reviewer.toml',
        },
      ]);
    });

    it('sends each item in a mixed basket to its own folder', async () => {
      const { server, user } = await renderMixed();
      await user.click(screen.getByRole('button', { name: 'Add docx to the basket' }));
      await user.click(screen.getByRole('radio', { name: /Agents/ }));
      await user.click(screen.getByRole('button', { name: 'Add code-reviewer to the basket' }));

      expect(screen.getByText('C:\\Users\\D.Finlay\\SaveCrap\\.claude\\skills')).toBeInTheDocument();
      expect(screen.getByText('C:\\Users\\D.Finlay\\SaveCrap\\.claude\\agents')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Copy 2 items to destination' }));

      expect(await screen.findByText('2 items copied to')).toBeInTheDocument();
      expect(server.copyRequests).toEqual([
        { source: 'C:\\Skills\\docx', destination: 'C:\\Users\\D.Finlay\\SaveCrap\\.claude\\skills', policy: 'skip' },
        { source: 'C:\\Agents\\code-reviewer.md', destination: 'C:\\Users\\D.Finlay\\SaveCrap\\.claude\\agents', policy: 'skip' },
      ]);
    });
  });

  it('shows the details of every card when Details is ticked in the list header', async () => {
    stubServer({ kinds: KINDS });
    const { user } = await renderWithList();
    expect(screen.queryByText('Found in 2 projects')).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Details' }));

    expect(screen.getByText('Found in 2 projects')).toBeInTheDocument();
    expect(within(card('docx')).getByText('Found in 1 project')).toBeInTheDocument();
    expect(within(card('docx')).getByRole('checkbox', { name: 'Show details' })).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Details' }));
    expect(screen.queryByText('Found in 2 projects')).not.toBeInTheDocument();
  });

  describe('sidebar', () => {
    // The guide view is a lazy chunk (react-markdown); its first import can take seconds, longer than findBy* waits.
    beforeAll(() => import('../features/guides/components/GuideView'), 60_000);

    const GUIDES = {
      claude: ['# Consolidated general guidance', '', '## 1. Engineering', '', '- Keep changes small'].join('\n'),
      agents: ['# Consolidated general agent guidance', '', '| Rule | Why |', '| --- | --- |', '| Plan first | Fewer surprises |'].join('\n'),
    };

    it('opens the Spec and Agents guides and returns to the library unchanged', async () => {
      stubServer({ kinds: KINDS, guides: GUIDES });
      const { user, container } = await renderWithList();
      await user.click(screen.getByRole('button', { name: 'Add docx to the basket' }));
      expect(screen.getByRole('button', { name: 'Skills & Agents' })).toHaveAttribute('aria-current', 'page');

      await user.click(screen.getByRole('button', { name: 'Spec' }));
      expect(await screen.findByRole('heading', { name: 'Consolidated general guidance' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '1. Engineering' })).toBeInTheDocument();
      expect(screen.getByText('C:\\Docs\\CLAUDE_GENERAL_GUIDANCE.md')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Copy basket' })).not.toBeInTheDocument();
      await expectNoAxeViolations(container);

      await user.click(screen.getByRole('button', { name: 'Agents' }));
      expect(await screen.findByRole('heading', { name: 'Consolidated general agent guidance' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Plan first' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Skills & Agents' }));
      expect(screen.getByRole('heading', { name: 'Copy basket' })).toBeInTheDocument();
      expect(within(basket()).getByText('docx')).toBeInTheDocument();
    });

    it('switches between the full guide and its summary', async () => {
      stubServer({ kinds: {}, guides: { ...GUIDES, 'claude-summary': '# Short guidance\n\n- Plan, then build' } });
      const user = userEvent.setup();
      renderApp();
      await user.click(screen.getByRole('button', { name: 'Spec' }));
      await screen.findByRole('heading', { name: 'Consolidated general guidance' });

      await user.click(screen.getByRole('button', { name: 'Summary' }));

      expect(await screen.findByRole('heading', { name: 'Short guidance' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Summary' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('heading', { name: 'Spec: Claude general guidance (summary)' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Agents' }));
      await user.click(await screen.findByRole('button', { name: 'Summary' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('AGENTS_GENERAL_GUIDANCE_SHORT.md: Not found on disk');
    });

    it('copies the guide on screen into the destination folder as spec.md', async () => {
      const server = stubServer({
        kinds: {},
        guides: { ...GUIDES, 'claude-summary': '# Short guidance' },
        copy: ({ destination, targetName }) => ({ outcome: 'copied', target: `${destination}\\${targetName ?? ''}` }),
      });
      const user = userEvent.setup();
      renderApp();
      await user.click(screen.getByRole('button', { name: 'Spec' }));
      await user.click(screen.getByRole('button', { name: 'Summary' }));
      await screen.findByRole('heading', { name: 'Short guidance' });
      expect(screen.getByText('C:\\Users\\D.Finlay\\SaveCrap\\spec.md')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Copy' }));

      expect(await screen.findByText('Copied to C:\\Users\\D.Finlay\\SaveCrap\\spec.md.')).toBeInTheDocument();
      expect(server.copyRequests).toEqual([
        { source: 'C:\\Docs\\CLAUDE_GENERAL_GUIDANCE_SHORT.md', destination: 'C:\\Users\\D.Finlay\\SaveCrap', policy: 'skip', targetName: 'spec.md' },
      ]);
    });

    it('says when spec.md already exists and was left alone', async () => {
      stubServer({
        kinds: {},
        guides: GUIDES,
        copy: () => ({ outcome: 'skipped', target: 'C:\\Users\\D.Finlay\\SaveCrap\\spec.md', message: 'Already exists in the destination' }),
      });
      const user = userEvent.setup();
      renderApp();
      await user.click(screen.getByRole('button', { name: 'Agents' }));
      await screen.findByRole('heading', { name: 'Consolidated general agent guidance' });

      await user.click(screen.getByRole('button', { name: 'Copy' }));

      expect(await screen.findByText(/spec\.md already exists, so it was left alone/)).toHaveAttribute('role', 'status');
    });

    it('explains when a guide file cannot be read', async () => {
      stubServer({ kinds: KINDS, guides: {} });
      const user = userEvent.setup();
      renderApp();

      await user.click(screen.getByRole('button', { name: 'Spec' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('CLAUDE_GENERAL_GUIDANCE.md: Not found on disk');
    });
  });
});
