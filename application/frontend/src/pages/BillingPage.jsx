// frontend/src/pages/BillingPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BillingPage = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch billing records
  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/billing", {
        params: { search }
      });
      setBills(res.data.bills || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  };

  // Make a payment
  const handlePayment = async (billId) => {
    const amount = prompt("Enter payment amount:");
    if (!amount) return;

    try {
      await axios.post(`/api/billing/${billId}/payments`, {
        amount,
        paymentMethod: "cash"
      });
      alert("Payment added successfully ✅");
      fetchBills();
    } catch (error) {
      console.error("Payment error:", error.response?.data || error);
      alert("Payment failed ❌");
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  return (
    <div className="p-6">
      <Card className="shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle>Billing Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Search by patient name, ID, or bill number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button onClick={fetchBills}>Search</Button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill._id}>
                    <TableCell>{bill.billNumber}</TableCell>
                    <TableCell>{bill.patientName}</TableCell>
                    <TableCell>₹{bill.totalAmount}</TableCell>
                    <TableCell>₹{bill.totalPaid || 0}</TableCell>
                    <TableCell className={bill.balanceAmount > 0 ? "text-red-600" : "text-green-600"}>
                      ₹{bill.balanceAmount}
                    </TableCell>
                    <TableCell>{bill.paymentStatus}</TableCell>
                    <TableCell>
                      {bill.balanceAmount > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handlePayment(bill._id)}
                        >
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingPage;
