import { Product } from "@shared/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShoppingCart, ShieldCheck, Zap, Star } from "lucide-react";

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Zap className="fill-primary" />
            <span>DigitalVault</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#" className="hover:text-primary transition-colors">How it works</a>
            <a href="#" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </nav>
          <Button variant="outline" size="sm" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            My Purchases
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <Badge variant="secondary" className="px-3 py-1 rounded-full bg-primary/10 text-primary border-none text-xs font-bold uppercase tracking-wider">
            Premium Digital Content
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Level up your skills with <span className="text-primary">expert guides.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            High-quality digital products delivered securely. Instant access after payment verification.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Secure Token System
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Verified Purchases
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-[350px] bg-white border-none shadow-sm"></Card>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {products.map((product) => (
              <Card key={product.id} className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white flex flex-col h-full">
                <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop`}
                    alt={product.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-none shadow-sm">₹{product.price}</Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold line-clamp-2 leading-tight min-h-[3rem] group-hover:text-primary transition-colors">
                      {product.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2 text-slate-500">
                    Premium digital content delivered instantly via secure token system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        Digital Download (.pdf, .zip)
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        One-time payment
                      </div>
                   </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button asChild className="w-full group/btn h-12 text-md font-bold rounded-xl shadow-md hover:shadow-primary/20">
                    <Link to={`/buy/${product.id}`}>
                      Buy Now
                      <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900">No products found</h2>
            <p className="text-slate-500 mt-2">Check back later for new digital content.</p>
          </div>
        )}

        {/* Footer info */}
        <section className="mt-32 max-w-4xl mx-auto py-16 border-t border-slate-200">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                 <h3 className="font-bold text-lg">Secure & Simple</h3>
                 <p className="text-sm text-slate-500">Pay via Fampay QR, upload proof, and get instant access to your digital files.</p>
              </div>
              <div className="space-y-4">
                 <h3 className="font-bold text-lg">Token Protected</h3>
                 <p className="text-sm text-slate-500">Download links are temporary and encrypted. Your files are safe with us.</p>
              </div>
              <div className="space-y-4">
                 <h3 className="font-bold text-lg">Support 24/7</h3>
                 <p className="text-sm text-slate-500">Need help with your purchase? Contact our support team any time.</p>
              </div>
           </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2024 DigitalVault. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
