import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Edit2, Trash2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

export default function ContactsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    type: "buyer" as const,
    status: "active" as const,
    notes: "",
  });

  const { data: contacts, refetch } = trpc.crm.contacts.list.useQuery();
  const createMutation = trpc.crm.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contact created successfully");
      setIsOpen(false);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", whatsappNumber: "", type: "buyer", status: "active", notes: "" });
      refetch();
    },
    onError: (error) => { toast.error(error.message || "Failed to create contact"); },
  });
  const deleteMutation = trpc.crm.contacts.delete.useMutation({
    onSuccess: () => { toast.success("Contact deleted"); refetch(); },
    onError: () => toast.error("Delete failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredContacts = contacts?.filter((contact) => {
    const matchesSearch =
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || contact.type === filterType;
    const matchesStatus = filterStatus === "all" || contact.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your buyers and sellers</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>Create a new buyer or seller contact in your database</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buyer">Buyer</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any notes about this contact..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-accent hover:bg-accent/90 text-white" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create Contact"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
      </div>

      {/* Filters */}
      <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buyer">Buyers</SelectItem>
                <SelectItem value="seller">Sellers</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground pt-2">
              {filteredContacts?.length || 0} contacts
            </div>
          </div>
      </div>

      {/* Contacts List */}
      <div>
        {filteredContacts && filteredContacts.length > 0 ? (
          <div className="grid gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="border border-border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        {contact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                          {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          contact.status === "active" ? "bg-green-100 text-green-700" :
                          contact.status === "converted" ? "bg-blue-100 text-blue-700" :
                          contact.status === "lost" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {contact.status ? contact.status.charAt(0).toUpperCase() + contact.status.slice(1) : "Active"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setLocation(`/crm/contacts/${contact.id}`)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => { if (confirm(`Delete ${contact.firstName} ${contact.lastName}?`)) deleteMutation.mutate(contact.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-border text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No contacts found</p>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Contact
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
