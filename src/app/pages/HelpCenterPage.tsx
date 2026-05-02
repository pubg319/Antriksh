import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/Button";
import { 
  Search, 
  BookOpen, 
  CreditCard, 
  User, 
  ShieldCheck, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp,
  LifeBuoy
} from "lucide-react";

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const categories = [
    { title: "Getting Started", icon: BookOpen, description: "Learn the basics of using our platform and taking courses." },
    { title: "Billing & Payments", icon: CreditCard, description: "Information about pricing, refunds, and payment methods." },
    { title: "Account & Profile", icon: User, description: "Manage your profile, security settings, and notifications." },
    { title: "Privacy & Security", icon: ShieldCheck, description: "Understand how we protect your data and privacy." },
  ];

  const faqs = [
    {
      question: "How do I enroll in a course?",
      answer: "To enroll in a course, simply navigate to the course listing page, select the course you're interested in, and click the 'Enroll Now' button. If it's a paid course, you'll be redirected to our secure payment gateway."
    },
    {
      question: "Can I access my courses offline?",
      answer: "Currently, our courses require an active internet connection to stream high-quality video content via Cloudflare Stream. This ensures you always have the latest version of the course material."
    },
    {
      question: "How can I get a certificate of completion?",
      answer: "Once you have marked all lessons in a course as complete, a 'Download Certificate' button will appear on your Course Player page and Student Dashboard."
    },
    {
      question: "What is your refund policy?",
      answer: "We offer a 7-day money-back guarantee for most courses if you have watched less than 20% of the content. Please contact our support team to initiate a refund request."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <header className="bg-gradient-to-br from-[#5B47ED] to-[#4938D6] py-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How can we help you?</h1>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search for articles, guides, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-4 rounded-2xl bg-white text-foreground shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/20 transition-all text-lg"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-border hover:border-[#5B47ED] hover:shadow-xl transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-[#5B47ED]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#5B47ED] transition-colors">
                <cat.icon className="w-6 h-6 text-[#5B47ED] group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{cat.description}</p>
            </div>
          ))}
        </div>

        {/* FAQs Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Can't find what you're looking for? Check out these common questions.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-accent/30 transition-colors"
                >
                  <span className="font-bold text-lg">{faq.question}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-muted-foreground animate-in slide-in-from-top-1 duration-200">
                    <p className="leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help Section */}
        <div className="mt-24 bg-[#5B47ED]/5 rounded-3xl p-12 text-center border border-[#5B47ED]/10">
          <div className="w-16 h-16 bg-[#5B47ED] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#5B47ED]/30">
            <LifeBuoy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our support team is available 24/7 to help you with any technical or billing issues you might be facing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="px-8 py-6 rounded-xl gap-2 h-auto text-lg">
              <MessageCircle className="w-6 h-6" />
              Chat with Support
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 rounded-xl h-auto text-lg">
              Email Us
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
