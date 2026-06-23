import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Papa from "papaparse";
import type {
  CreditRiskPayload,
  BatchCreditRiskResult,
} from "./types";

const API_URL = "http://127.0.0.1:8001/batch-score";

const expectedFields = [
  "id",
  "limit_bal",
  "sex",
  "education",
  "marriage",
  "age",
  "pay_0",
  "pay_2",
  "pay_3",
  "pay_4",
  "pay_5",
  "pay_6",
  "bill_amt1",
  "bill_amt2",
  "bill_amt3",
  "bill_amt4",
  "bill_amt5",
  "bill_amt6",
  "pay_amt1",
  "pay_amt2",
  "pay_amt3",
  "pay_amt4",
  "pay_amt5",
  "pay_amt6",
] as const satisfies readonly (keyof CreditRiskPayload)[];

type ParsedCustomerRow = {
  rowNumber: number;
  payload: CreditRiskPayload;
};


export default function BatchCreditForm() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedCustomerRow[]>([]);
  const [results, setResults] = useState<BatchCreditRiskResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({
    done: 0,
    total: 0,
  });
  const [reportId, setReportId] = useState("");

const resetBatchState = () => {
  setRows([]);
  setResults([]);
  setErrors([]);
  setProgress({ done: 0, total: 0 });
  setReportId("");
};

  const parseCsvRow = (
    row: Record<string, string>,
    rowNumber: number
  ): ParsedCustomerRow | null => {
    const payload = {} as CreditRiskPayload;
    const rowErrors: string[] = [];

    expectedFields.forEach((field) => {
      const rawValue = row[field];

      if (rawValue === undefined || rawValue === null || rawValue === "") {
        rowErrors.push(`Row ${rowNumber}: missing value for "${field}"`);
        return;
      }

      const numericValue = Number(rawValue);

      if (!Number.isFinite(numericValue)) {
        rowErrors.push(`Row ${rowNumber}: "${field}" must be a number`);
        return;
      }

      payload[field] = numericValue;
    });

    if (rowErrors.length > 0) {
      setErrors((previousErrors) => [...previousErrors, ...rowErrors]);
      return null;
    }

    return {
      rowNumber,
      payload,
    };
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    resetBatchState();
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parseResult) => {
        const headers = parseResult.meta.fields ?? [];

        const missingColumns = expectedFields.filter(
          (field) => !headers.includes(field)
        );

        if (missingColumns.length > 0) {
          setErrors([
            `CSV is missing required columns: ${missingColumns.join(", ")}`,
          ]);
          return;
        }

        const parsedRows: ParsedCustomerRow[] = [];

        parseResult.data.forEach((row, index) => {
          const csvRowNumber = index + 2; // because row 1 is the header
          const parsedRow = parseCsvRow(row, csvRowNumber);

          if (parsedRow) {
            parsedRows.push(parsedRow);
          }
        });

        setRows(parsedRows);
      },
      error: (error) => {
        setErrors([`Unable to read CSV file: ${error.message}`]);
      },
    });
  };

 const handleBatchSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (rows.length === 0) {
    setErrors(["Please upload a valid CSV file before scoring."]);
    return;
  }

  setLoading(true);
  setResults([]);
  setErrors([]);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_name: fileName,
        records: rows.map((row) => row.payload),
  }),
    });

    if (!res.ok) {
      throw new Error(`Batch API returned status ${res.status}`);
    }

    const data = await res.json();

    setReportId(data.report_id);

    setResults(data.results);

    setErrors(
      data.errors.map(
        (item: any) => `Row ${item.row_index}: ${item.error}`
      )
    );

    setProgress({
      done: data.successful,
      total: data.total_records,
    });

    setReportId(data.report_id);

  } catch (error) {
    setErrors([
      error instanceof Error
        ? error.message
        : "Unable to complete batch scoring.",
    ]);
  } finally {
    setLoading(false);
  }
};

  const downloadResults = () => {
    if (results.length === 0) return;

    const csv = Papa.unparse(results);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "credit-risk-batch-results.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <section className="credit-card">
      <h2>Batch Credit Risk Scoring</h2>
      <p className="form-description">
        Upload a CSV file to score multiple customers. Each row must contain the
        full credit risk payload.
      </p>

      <form onSubmit={handleBatchSubmit}>
        <div className="upload-box">
          <label htmlFor="batchCsv">Upload CSV File</label>

          <input
            id="batchCsv"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
          />

          {fileName && <p className="file-name">Selected file: {fileName}</p>}
        </div>

        {rows.length > 0 && (
          <div className="batch-summary">
            <strong>{rows.length}</strong> valid customer record
            {rows.length === 1 ? "" : "s"} ready for scoring.
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Scoring Batch..." : "Score Uploaded CSV"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="progress-card">
          Scored {progress.done} of {progress.total} records
        </div>
      )}

     {errors.length > 0 && (
  <div className="error-card">
    ...
  </div>
)}

{reportId && (
  <div className="saved-report-card">
    <strong>Score report saved.</strong>

    <p>Report ID: {reportId}</p>

    <a
      className="secondary-button"
      href={`http://127.0.0.1:8001/score-reports/${reportId}/csv`}
      target="_blank"
      rel="noreferrer"
    >
      Download Saved Report CSV
    </a>
  </div>
)}

{results.length > 0 && (
  <div className="result-card">
          <div className="result-header">
            <h3>Batch Results</h3>

            <button
              type="button"
              className="secondary-button"
              onClick={downloadResults}
            >
              Download Results CSV
            </button>
          </div>

          <div className="table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>CSV Row</th>
                  <th>Customer ID</th>
                  <th>Prediction</th>
                  <th>Probability</th>
                  <th>Risk Label</th>
                </tr>
              </thead>

<tbody>
  {results.map((result) => (
    <tr key={`${result.row_index}-${result.id}`}>
      <td>{result.row_index}</td>

      <td>{result.id}</td>

      <td>{result.default_prediction}</td>

      <td>
        {(result.probability_of_default * 100).toFixed(2)}%
      </td>

      <td
        className={
          result.default_prediction === 1
            ? "risk-high"
            : "risk-low"
        }
      >
        {result.risk_label}
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
  
}

