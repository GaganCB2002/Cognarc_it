"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/interview-hub/SearchInput";
import { Pagination } from "@/components/interview-hub/Pagination";
import { QuestionCard } from "@/components/interview-hub/QuestionCard";
import { CardSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import { EmptyState } from "@/components/interview-hub/EmptyState";
import api from "@/lib/api";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";

interface CompanyQuestion {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  difficulty: string;
  tags: string[];
  company: string;
  frequency?: number;
  category?: string;
  similar?: { question: string; difficulty: string }[];
}

interface CompanyQuestionsResponse {
  questions: CompanyQuestion[];
  total: number;
  company: { name: string; questions: number; topTech: string[] };
}

const companies = [
  { id: "google", name: "Google", logo: "G", questions: 245, topTech: ["Java", "Python", "System Design", "Algorithms"], color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "microsoft", name: "Microsoft", logo: "M", questions: 210, topTech: ["C#", "Azure", ".NET", "System Design"], color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "amazon", name: "Amazon", logo: "A", questions: 280, topTech: ["Java", "AWS", "System Design", "Leadership"], color: "text-orange-400", bg: "bg-orange-500/10" },
  { id: "meta", name: "Meta", logo: "M", questions: 195, topTech: ["React", "PHP", "System Design", "Product Sense"], color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "netflix", name: "Netflix", logo: "N", questions: 140, topTech: ["Java", "Spring Boot", "AWS", "Microservices"], color: "text-red-400", bg: "bg-red-500/10" },
  { id: "apple", name: "Apple", logo: "A", questions: 160, topTech: ["Swift", "Objective-C", "System Design", "Privacy"], color: "text-gray-400", bg: "bg-gray-500/10" },
  { id: "uber", name: "Uber", logo: "U", questions: 120, topTech: ["Java", "Go", "Microservices", "Distributed Systems"], color: "text-black", bg: "bg-white/10" },
  { id: "stripe", name: "Stripe", logo: "S", questions: 90, topTech: ["Ruby", "Java", "API Design", "Distributed Systems"], color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: "linkedin", name: "LinkedIn", logo: "L", questions: 110, topTech: ["Java", "Scala", "Kafka", "Distributed Systems"], color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "twitter", name: "Twitter (X)", logo: "X", questions: 85, topTech: ["Java", "Scala", "Real-time Systems", "Data Streaming"], color: "text-gray-400", bg: "bg-gray-500/10" },
  { id: "salesforce", name: "Salesforce", logo: "S", questions: 75, topTech: ["Java", "Apex", "Cloud Computing", "CRM"], color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "ibm", name: "IBM", logo: "I", questions: 95, topTech: ["Java", "Python", "Cloud", "AI/ML"], color: "text-blue-400", bg: "bg-blue-500/10" },
];

export default function CompanyPage() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [companyQuestions, setCompanyQuestions] = useState<CompanyQuestion[]>([]);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; questions: number; topTech: string[] } | null>(null);
  const pageSize = 5;

  const filteredCompanies = companies.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.topTech.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

  const fetchCompanyQuestions = useCallback(async (companyId: string) => {
    setLoading(true);
    try {
      const data = await api.get<CompanyQuestionsResponse>(`/interview/company/${companyId}`);
      setCompanyQuestions(data.questions || []);
      setCompanyInfo(data.company || null);
    } catch {
      setCompanyQuestions([]);
      setCompanyInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const totalPages = Math.ceil(companyQuestions.length / pageSize);
  const paginated = companyQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCompanyClick = (id: string) => {
    setSelectedCompany(id);
    setCurrentPage(1);
    fetchCompanyQuestions(id);
  };

  const handleSave = async (id: string) => {
    try {
      if (savedIds.has(id)) {
        await api.delete(`/interview/saved/${id}`);
        setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        await api.post("/interview/saved", { itemType: "question", itemId: id });
        setSavedIds(prev => { const n = new Set(prev); n.add(id); return n; });
      }
    } catch {
      // ignore
    }
  };

  if (selectedCompany) {
    const company = companies.find(c => c.id === selectedCompany);
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-8">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={() => { setSelectedCompany(null); setSearchQuery(""); }}
            className="flex items-center gap-1.5 text-xs text-st-text-muted hover:text-st-accent transition-colors mb-3"
          >
            <ArrowLeft className="w-3 h-3" /> Back to companies
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${company?.bg} flex items-center justify-center`}>
              <span className={`text-lg font-bold ${company?.color}`}>{company?.logo}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-st-text-primary">{companyInfo?.name || company?.name} Questions</h1>
              <p className="text-sm text-st-text-muted">{companyInfo?.questions || company?.questions} questions available</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {(companyInfo?.topTech || company?.topTech || []).map(tech => (
              <Badge key={tech} variant="outline" className="text-[10px]">{tech}</Badge>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
        ) : paginated.length === 0 ? (
          <EmptyState icon={Search} title="No questions found" description="No questions available for this company yet" />
        ) : (
          <div className="space-y-3">
            {paginated.map(q => (
              <QuestionCard key={q.id} question={q} onSave={handleSave} isSaved={savedIds.has(q.id)} />
            ))}
          </div>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-st-text-primary tracking-tight">Company-wise Questions</h1>
        <p className="text-sm text-st-text-secondary">Browse interview questions by company</p>
      </motion.div>

      <SearchInput
        value={searchQuery}
        onChange={(v) => setSearchQuery(v)}
        placeholder="Search companies or technologies..."
      />

      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredCompanies.map((company, i) => (
          <motion.div
            key={company.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card
              className="p-4 hover:border-st-accent/20 transition-all duration-200 cursor-pointer card-hover"
              onClick={() => handleCompanyClick(company.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${company.bg} flex items-center justify-center shrink-0`}>
                  <span className={`text-base font-bold ${company.color}`}>{company.logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-st-text-primary">{company.name}</h3>
                  <p className="text-xs text-st-text-muted">{company.questions} questions</p>
                </div>
                <ChevronRight className="w-4 h-4 text-st-text-muted" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {company.topTech.slice(0, 3).map(tech => (
                  <Badge key={tech} variant="outline" className="text-[9px]">{tech}</Badge>
                ))}
                {company.topTech.length > 3 && (
                  <Badge variant="outline" className="text-[9px]">+{company.topTech.length - 3}</Badge>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredCompanies.length === 0 && (
        <EmptyState icon={Search} title="No companies found" description="Try a different search term" />
      )}
    </div>
  );
}
