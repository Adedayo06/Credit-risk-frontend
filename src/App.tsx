import "./App.css";
import CreditForm from "./CreditForm";
import BatchCreditForm from "./BatchCreditForm";

function App() {
  return (
    <main className="app">
      <div className="app-container">
        <header className="app-header">
          <h1>Credit Risk Scoring</h1>
          <p>
            Score a single customer manually or upload a CSV file for batch
            credit risk prediction.
          </p>
        </header>

        <div className="form-stack">
          <CreditForm />
          <BatchCreditForm />
        </div>
      </div>
    </main>
  );
}

export default App;