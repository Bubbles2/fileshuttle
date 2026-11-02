/** A private drag type, so text or files dragged in from elsewhere are not accepted as items. */
export const ITEM_DRAG_TYPE = 'application/x-fileshuttle-item';

export function writeItemDragData(transfer: DataTransfer, id: string): void {
  transfer.setData(ITEM_DRAG_TYPE, id);
  transfer.effectAllowed = 'copy';
}

export function hasItemDragData(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).includes(ITEM_DRAG_TYPE);
}

export function readItemDragData(transfer: DataTransfer): string | null {
  return transfer.getData(ITEM_DRAG_TYPE) || null;
}
