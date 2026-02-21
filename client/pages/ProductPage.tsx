import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ProductDetail, PaymentResponse } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Download, ExternalLink, QrCode, ShieldCheck, Wallet } from "lucide-react";

const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    transactionId: "",
    screenshot: null as File | null,
  });

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast({ variant: "destructive", title: "Error", description: data.error });
        } else {
          setProduct(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        toast({ variant: "destructive", title: "Error", description: "Failed to load product" });
        setLoading(false);
      });
  }, [productId, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, screenshot: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.screenshot) {
      toast({ variant: "destructive", title: "Error", description: "Please upload a payment screenshot" });
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    data.append("productId", productId || "");
    data.append("name", formData.name);
    data.append("transactionId", formData.transactionId);
    data.append("screenshot", formData.screenshot);

    try {
      const response = await fetch("/api/submit-payment", {
        method: "POST",
        body: data,
      });
      const result: PaymentResponse = await response.json();
      
      if (result.success) {
        setPaymentResult(result);
        toast({ title: "Success", description: "Payment verified!" });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit payment" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Details Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge variant="outline" className="text-primary border-primary">Digital Product</Badge>
            <h1 className="text-4xl font-bold tracking-tight">{product.title}</h1>
            <p className="text-3xl font-bold text-primary">₹{product.price}</p>
          </div>

          <Card className="border-2 border-dashed border-muted bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Step 1: Make Payment
              </CardTitle>
              <CardDescription>Scan the QR code below or pay to the Fampay ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-white p-4 inline-block rounded-xl shadow-sm mx-auto">
                <img 
                  src={product.qrImage} 
                  alt="Payment QR Code" 
                  className="w-48 h-48 mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=Scan+to+Pay";
                  }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Fampay ID</p>
                <div className="flex items-center justify-center gap-2 bg-secondary p-3 rounded-lg">
                  <span className="font-mono font-bold text-lg">{product.fampayId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-4 rounded-lg border border-primary/10">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <p>Your payment is secure. All downloads are protected with temporary tokens.</p>
          </div>
        </div>

        {/* Payment Verification Section */}
        <div>
          {paymentResult && paymentResult.success ? (
            <Card className="h-full border-primary shadow-lg shadow-primary/10 bg-primary/5 animate-in fade-in zoom-in duration-300">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl">Payment Verified!</CardTitle>
                <CardDescription>Your digital product is ready for download.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="p-6 bg-white rounded-xl border-2 border-primary/20 text-center">
                   <p className="text-sm text-muted-foreground mb-2 italic">Token expires in 10 minutes</p>
                   <a 
                    href={`/api/download/${paymentResult.downloadToken}`}
                    className="flex items-center justify-center gap-2 w-full bg-primary text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg"
                   >
                    <Download className="w-6 h-6" />
                    Download Now
                   </a>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    If the download doesn't start automatically, please click the button above.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full border-t-4 border-t-primary shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Step 2: Submit Payment Proof
                </CardTitle>
                <CardDescription>
                  Enter your details and upload the payment screenshot to get your download link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Enter your full name" 
                      required 
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input 
                      id="transactionId" 
                      name="transactionId" 
                      placeholder="Enter Fampay transaction ID" 
                      required 
                      value={formData.transactionId}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="screenshot">Payment Screenshot</Label>
                    <div className="grid w-full items-center gap-1.5">
                      <Input 
                        id="screenshot" 
                        type="file" 
                        accept="image/*" 
                        required 
                        onChange={handleFileChange}
                        className="cursor-pointer file:bg-primary file:text-white file:rounded-md file:border-0 file:px-3 file:py-1 file:mr-4 file:hover:bg-primary/90"
                      />
                      <p className="text-[10px] text-muted-foreground">Max size 2MB. Format: JPG, PNG, GIF</p>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-bold transition-all hover:scale-[1.01]" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Verifying Payment...
                      </span>
                    ) : (
                      "Submit & Verify"
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-4">
                    By submitting, you agree to our Terms of Service and Digital Content Delivery Policy.
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
