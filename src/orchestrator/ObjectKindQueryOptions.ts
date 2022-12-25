export class OrchestratorLabelFilters {
  static equals(label: string, value: string): OrchestratorLabelFilter {
    return {
      label,
      operator: LabelFilterOperator.Equal,
      value,
    };
  }

  static in(label: string, value: string[]): OrchestratorLabelFilter {
    return {
      label,
      operator: LabelFilterOperator.In,
      value,
    };
  }
}
export enum LabelFilterOperator {
  Equal,
  In,
}
export interface OrchestratorLabelFilter {
  label: string;
  operator: LabelFilterOperator;
  value: string | string[];
}
export interface ObjectKindQueryOptions {
  labelFilter?: OrchestratorLabelFilter[];
}
