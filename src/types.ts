export interface CreditRiskPayload {
  id: number;
  limit_bal: number;
  sex: number;
  education: number;
  marriage: number;
  age: number;

  pay_0: number;
  pay_2: number;
  pay_3: number;
  pay_4: number;
  pay_5: number;
  pay_6: number;

  bill_amt1: number;
  bill_amt2: number;
  bill_amt3: number;
  bill_amt4: number;
  bill_amt5: number;
  bill_amt6: number;

  pay_amt1: number;
  pay_amt2: number;
  pay_amt3: number;
  pay_amt4: number;
  pay_amt5: number;
  pay_amt6: number;
}

export type CreditRiskResult = {
  default_prediction: number;
  probability_of_default: number;
};

export type BatchCreditRiskResult = CreditRiskPayload &
  CreditRiskResult & {
    row_index: number;
    risk_label: string;
  };

  export type BatchScoreError = {
  row_index: number;
  id?: number;
  error: string;
};

export type BatchScoreResponse = {
  report_id: string;
  total_records: number;
  successful: number;
  failed: number;
  results: BatchCreditRiskResult[];
  errors: BatchScoreError[];
};