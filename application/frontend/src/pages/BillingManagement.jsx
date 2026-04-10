import { useState, useEffect } from "react";
import { billingAPI } from "../utils/api";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

import {
  CreditCard,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function BillingManagement() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState({}); 

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = { search, paymentStatus: filter === "all" ? undefined : filter };
      const res = await billingAPI.getAll(params);
      setBills(res.data.bills || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load billing records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [search, filter]);

  const formatCurrency = (v) => {
    const n = Number(v) || 0;
    return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  };

  const getPatientDisplayName = (bill) => {
    if (bill.patientName) return bill.patientName;
    if (bill.patient) {
      const p = bill.patient;
      return `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.patientId || "—";
    }
    return "—";
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Paid</Badge>;
      case "partial":
        return <Badge className="bg-yellow-400"><Clock className="mr-1 h-3 w-3" />Partial</Badge>;
      case "pending":
        return <Badge className="bg-gray-200"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-600"><AlertTriangle className="mr-1 h-3 w-3" />Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handlePayment = async (billId) => {
    const amount = parseFloat(paymentAmounts[billId]);
    const bill = bills.find(b => b._id === billId);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > (bill.balanceAmount || 0)) {
      toast.error("Amount cannot exceed balance");
      return;
    }
    try {
      await billingAPI.addPayment(billId, {
        amount,
        paymentMethod: "cash",
        transactionId: `TXN-${Date.now()}`,
        notes: "Payment via BillingManagement"
      });
      toast.success("Payment recorded");
      setPaymentAmounts(prev => ({ ...prev, [billId]: "" }));
      fetchBills();
      if (selectedBill && selectedBill._id === billId) {
        const detailRes = await billingAPI.getById(billId);
        setSelectedBill(detailRes.data.bill);
      }
    } catch (err) {
      console.error(err);
      toast.error("Payment failed");
    }
  };

  const openDetails = async (bill) => {
    try {
      const res = await billingAPI.getById(bill._id);
      setSelectedBill(res.data.bill);
      setShowDialog(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bill details");
    }
  };

  // Calculate totals for cards
  const totalAmount = bills.reduce((sum, b) => sum + b.netAmount, 0);
  const totalPaid = bills.reduce((sum, b) => sum + b.totalPaid, 0);
  const totalBalance = bills.reduce((sum, b) => sum + b.balanceAmount, 0);

  return (
    <div className="space-y-8 p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
          <CreditCard className="h-8 w-8 text-blue-600" /> Billing Management
        </h1>
        <Button variant="outline" onClick={fetchBills}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Bills" value={bills.length} color="bg-blue-600" />
        <StatsCard title="Total Amount" value={formatCurrency(totalAmount)} color="bg-indigo-500" />
        <StatsCard title="Collected" value={formatCurrency(totalPaid)} color="bg-green-600" />
        <StatsCard title="Outstanding" value={formatCurrency(totalBalance)} color="bg-red-600" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <Input
          placeholder="Search by patient, ID, or bill #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button onClick={fetchBills}>Search</Button>
        <Button variant="outline" onClick={() => { setSearch(""); fetchBills(); }}>Clear</Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "partial", "paid", "overdue"].map(f => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Billing Table */}
      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Billing Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bills.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No billing records found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map(bill => (
                  <TableRow key={bill._id} className="hover:bg-gray-50 transition">
                    <TableCell>{bill.billNumber}</TableCell>
                    <TableCell>{getPatientDisplayName(bill)}</TableCell>
                    <TableCell>{formatCurrency(bill.netAmount)}</TableCell>
                    <TableCell>{formatCurrency(bill.totalPaid)}</TableCell>
                    <TableCell className={bill.balanceAmount > 0 ? "text-red-600" : "text-green-600"}>
                      {formatCurrency(bill.balanceAmount)}
                    </TableCell>
                    <TableCell>{getPaymentStatusBadge(bill.paymentStatus)}</TableCell>
                    <TableCell>
                      {bill.balanceAmount > 0 && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={bill.balanceAmount}
                            value={paymentAmounts[bill._id] || ""}
                            onChange={e => setPaymentAmounts(prev => ({ ...prev, [bill._id]: e.target.value }))}
                            placeholder="Amount"
                            className="w-24"
                          />
                          <Button size="sm" variant="secondary" onClick={() => handlePayment(bill._id)}>Pay</Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openDetails(bill)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bill Details Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setSelectedBill(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bill Details</DialogTitle></DialogHeader>
          {!selectedBill ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{selectedBill.billNumber}</div>
                  <div className="text-gray-500">{getPatientDisplayName(selectedBill)}</div>
                </div>
                <div className="text-right">
                  <div>Total: {formatCurrency(selectedBill.totalAmount)}</div>
                  <div>Paid: {formatCurrency(selectedBill.totalPaid)}</div>
                  <div className={selectedBill.balanceAmount > 0 ? "text-red-600" : "text-green-600"}>
                    Balance: {formatCurrency(selectedBill.balanceAmount)}
                  </div>
                </div>
              </div>
              <Charges payments={selectedBill.payments} charges={selectedBill.charges} notes={selectedBill.notes} formatCurrency={formatCurrency} />
            </div>
          )}
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button onClick={() => { setShowDialog(false); setSelectedBill(null); }}>Close</Button>
            {selectedBill && selectedBill.balanceAmount > 0 && (
              <Button variant="secondary" onClick={() => { setShowDialog(false); handlePayment(selectedBill._id); }}>Pay</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stats Card Component
const StatsCard = ({ title, value, icon, subtitle, valueColor }) => (
  <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between hover:shadow-lg transition border">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-600">{title}</span>
      {icon}
    </div>
    <div className={`text-2xl font-bold ${valueColor || "text-gray-800"}`}>{value}</div>
    {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
  </div>
);

// Charges & Payments Component
const Charges = ({ charges, payments, notes, formatCurrency }) => (
  <>
    <div>
      <h4 className="font-semibold">Charges</h4>
      {charges?.bedCharges && <div>Bed Charges: {formatCurrency(charges.bedCharges.totalBedCharges)}</div>}
      {charges?.medicalCharges?.length > 0 && (
        <div>
          Medical Charges:
          <ul className="list-disc pl-6">
            {charges.medicalCharges.map((c, i) => <li key={i}>{c.description} — {formatCurrency(c.amount)}</li>)}
          </ul>
        </div>
      )}
      {charges?.additionalCharges?.length > 0 && (
        <div>
          Additional Charges:
          <ul className="list-disc pl-6">
            {charges.additionalCharges.map((c, i) => <li key={i}>{c.description} — {formatCurrency(c.amount)}</li>)}
          </ul>
        </div>
      )}
    </div>
    <div>
      <h4 className="font-semibold">Payments</h4>
      {payments?.length ? (
        <ul className="list-disc pl-6">
          {payments.map((p, i) => <li key={i}>{formatCurrency(p.amount)} — {p.paymentMethod} — {new Date(p.paymentDate).toLocaleString()}</li>)}
        </ul>
      ) : <div className="text-gray-500">No payments recorded</div>}
    </div>
    <div>
      <h4 className="font-semibold">Notes</h4>
      <div>{notes || "—"}</div>
    </div>
  </>
);
