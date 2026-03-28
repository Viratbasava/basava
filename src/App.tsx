/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import SessionPage from "./pages/SessionPage";
import SessionDetail from "./pages/SessionDetail";
import Split from "./pages/Split";
import Report from "./pages/Report";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sessions" element={<SessionPage />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/split" element={<Split />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </Layout>
    </Router>
  );
}
