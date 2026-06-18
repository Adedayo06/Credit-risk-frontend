import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { CreditRiskPayload } from "./types";
 
const initialState: CreditRiskPayload = {
  id: 0,
  limit_bal: 0,
  sex: 1,
  education: 2,
  marriage: 1,
  age: 0,
 
  pay_0: 0,
  pay_2: 0,
  pay_3: 0,
  pay_4: 0,
  pay_5: 0,
  pay_6: 0,
 
  bill_amt1: 0,
  bill_amt2: 0,
  bill_amt3: 0,
  bill_amt4: 0,
  bill_amt5: 0,
  bill_amt6: 0,
 
  pay_amt1: 0,
  pay_amt2: 0,
  pay_amt3: 0,
  pay_amt4: 0,
  pay_amt5: 0,
  pay_amt6: 0,
};
 
type CreditRiskResult = {
  default_prediction: number;
  probability_of_default: number;
};
 
type CreditRiskField = keyof CreditRiskPayload;
 
export default function CreditForm() {
  const [form, setForm] = useState<CreditRiskPayload>(initialState);
  const [result, setResult] = useState<CreditRiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
 
    setForm((previousForm) => ({
      ...previousForm,
      [name]: Number(value),
    }));
  };
 
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
 
    setLoading(true);
    setError("");
    setResult(null);
 
    try {
      const res = await fetch("http://127.0.0.1:8000/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
 
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
 
      const data: CreditRiskResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Unable to score credit risk. Please confirm that the backend API is running.");
    } finally {
      setLoading(false);
    }
  };
 
  const fields = Object.keys(form) as CreditRiskField[];
 
 return (
<section className="credit-card">
<h2>Credit Risk Form</h2>
<p className="form-description">
      Supply all customer parameters at runtime. The form will send the payload to
      the scoring API.
</p>
 
    <form onSubmit={handleSubmit}>
<div className="form-grid">
        {Object.keys(form).map((key) => (
<div key={key} className="form-field">
<label htmlFor={key}>{key}</label>
 
            <input
              id={key}
              type="number"
              name={key}
              value={(form as any)[key]}
              onChange={handleChange}
            />
</div>
        ))}
</div>
 
      <div className="form-actions">
<button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Predicting..." : "Submit for Scoring"}
</button>
</div>
</form>
 
    {error && <div className="error-card">{error}</div>}
 
    {result && (
<div className="result-card">
<h3>Scoring Result</h3>
 
        <div className="result-grid">
<div className="result-item">
<span className="result-label">Default Prediction</span>
<span
              className={
                result.default_prediction === 1
                  ? "result-value risk-high"
                  : "result-value risk-low"
              }
>
              {result.default_prediction === 1
                ? "Likely to Default"
                : "Not Likely to Default"}
</span>
</div>
 
          <div className="result-item">
<span className="result-label">Probability of Default</span>
<span
              className={
                result.probability_of_default >= 0.5
                  ? "result-value risk-high"
                  : "result-value risk-low"
              }
>
              {(result.probability_of_default * 100).toFixed(2)}%
</span>
</div>
</div>
 
        <pre className="raw-result">{JSON.stringify(result, null, 2)}</pre>
</div>
    )}
</section>
);
}