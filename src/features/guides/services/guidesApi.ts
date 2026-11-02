import { guideResponseSchema, type GuideName, type GuideResponse, type GuideVariant } from '../../../../shared/api.ts';
import { postJson } from '../../../services/apiClient';

export function fetchGuide(name: GuideName, variant: GuideVariant): Promise<GuideResponse> {
  return postJson('/api/guides', { name, variant }, guideResponseSchema);
}
