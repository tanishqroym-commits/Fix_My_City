import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import ReportIssueSection from "@/components/ReportIssueSection";
import Footer from "@/components/Footer";


const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-100 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
      <Header />
      <main className="space-y-16 py-8">
        <HeroSection />
        <StatsSection />
        <ReportIssueSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
