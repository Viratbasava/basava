export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  payment: string;
  date: string;
  type?: "Income" | "Expense";
  session_id: number | null;
}

export interface Session {
  id: number;
  name: string;
  date: string;
  expenses?: Expense[];
}
