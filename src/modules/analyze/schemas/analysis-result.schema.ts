import { DEFECT_SEVERITY } from 'src/utils/constants/analysis.constants';
import { z } from 'zod';

export const analysisResultSchema = z.object({
  success: z
    .boolean()
    .describe(
      "Whether the inspection can be processed. Set this to `false` if there's no parameter to analyze defects from the data.",
    ),
  summary: z
    .string()
    .optional()
    .describe('Concise summary of the inspection findings'),
  defects: z
    .array(
      z.object({
        code: z.string().describe('Short defect code, e.g. DEF-001'),
        description: z
          .string()
          .describe('Human-readable description of the defect'),
        severity: z.enum(DEFECT_SEVERITY).describe('Severity of the defect'),
      }),
    )
    .optional()
    .describe('List of detected defects, empty if none found'),
  recommendedAction: z
    .string()
    .describe('Recommended remediation action for the engineer'),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
