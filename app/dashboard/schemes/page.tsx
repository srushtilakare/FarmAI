'use client';

import { useState, useEffect } from 'react';
import { Building2, Search, Filter, ExternalLink, FileText, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface GovernmentScheme {
  _id: string;
  schemeName: string;
  description: string;
  state: string | string[]; // Can be a string or array for backward compatibility
  category: string[];
  farmerType: string[];
  gender: string[];
  benefits: string;
  eligibility: string | string[];
  applicationProcess?: string;
  requiredDocuments?: string[];
  officialWebsite?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  deadline?: string;
  budgetAmount?: string;
  ministry?: string;
  schemeType: string;
}

const schemeTypeColors: { [key: string]: string } = {
  subsidy: 'bg-green-100 text-green-800',
  loan: 'bg-blue-100 text-blue-800',
  insurance: 'bg-purple-100 text-purple-800',
  training: 'bg-yellow-100 text-yellow-800',
  equipment: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function GovernmentSchemesPage() {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [recommendedSchemes, setRecommendedSchemes] = useState<GovernmentScheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('recommended');
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendedSchemes();
    fetchAllSchemes();
  }, []);

  const fetchRecommendedSchemes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/schemes/recommended', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendedSchemes(data.schemes);
      }
    } catch (error) {
      console.error('Error fetching recommended schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSchemes = async () => {
    try {
      let url = 'http://localhost:5000/api/schemes/all?';
      if (filterType !== 'all') url += `schemeType=${filterType}&`;
      if (searchQuery) url += `search=${searchQuery}&`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setSchemes(data.schemes);
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllSchemes();
    }
  }, [searchQuery, filterType, activeTab]);

  const SchemeCard = ({ scheme }: { scheme: GovernmentScheme }) => (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setSelectedScheme(scheme)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{scheme.schemeName}</CardTitle>
            <CardDescription className="line-clamp-2">{scheme.description}</CardDescription>
          </div>
          <Badge className={schemeTypeColors[scheme.schemeType]}>
            {scheme.schemeType.charAt(0).toUpperCase() + scheme.schemeType.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scheme.ministry && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">{scheme.ministry}</span>
            </div>
          )}
          
          {scheme.budgetAmount && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">{t("budget")}:</span>
              <span className="text-sm text-green-600 font-semibold">{scheme.budgetAmount}</span>
            </div>
          )}
          
          {(() => {
            const states = Array.isArray(scheme.state) 
              ? scheme.state.filter(s => s !== 'all')
              : scheme.state !== 'all' 
                ? [scheme.state] 
                : [];
            
            if (states.length === 0) return null;
            
            return (
              <div className="flex flex-wrap gap-1">
                {states.slice(0, 3).map((state, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {state}
                  </Badge>
                ))}
                {states.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{states.length - 3} more
                  </Badge>
                )}
              </div>
            );
          })()}
          
          <Button variant="outline" className="w-full">
            <Info className="h-4 w-4 mr-2" />
            {t("viewDetails")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <div className="p-2 rounded-full bg-orange-500">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          {t("governmentSchemesFinder")}
        </h1>
        <p className="text-gray-600 mt-1">
          {t("discoverSchemesBenefits")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommended">{t("recommendedForYou")}</TabsTrigger>
          <TabsTrigger value="all">{t("allSchemes")}</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : recommendedSchemes.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t("noSchemesFound")}</h3>
                <p className="text-gray-600">
                  {t("completeProfileForRecommendations")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendedSchemes.map((scheme) => (
                <SchemeCard key={scheme._id} scheme={scheme} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder={t("searchSchemes")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("schemeType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allTypes")}</SelectItem>
                    <SelectItem value="subsidy">{t("subsidy")}</SelectItem>
                    <SelectItem value="loan">{t("loan")}</SelectItem>
                    <SelectItem value="insurance">{t("insurance")}</SelectItem>
                    <SelectItem value="training">{t("training")}</SelectItem>
                    <SelectItem value="equipment">{t("equipment")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {schemes.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t("noSchemesFound")}</h3>
                <p className="text-gray-600">
                  {t("tryAdjustingSearch")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {schemes.map((scheme) => (
                <SchemeCard key={scheme._id} scheme={scheme} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Scheme Detail Dialog */}
      {selectedScheme && (
        <Dialog open={!!selectedScheme} onOpenChange={() => setSelectedScheme(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl">{selectedScheme.schemeName}</DialogTitle>
                  <DialogDescription className="mt-2">
                    {selectedScheme.ministry && `${selectedScheme.ministry} • `}
                    {selectedScheme.schemeType.charAt(0).toUpperCase() + selectedScheme.schemeType.slice(1)}
                  </DialogDescription>
                </div>
                <Badge className={schemeTypeColors[selectedScheme.schemeType]}>
                  {selectedScheme.schemeType}
                </Badge>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
              {selectedScheme.description && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {t("description")}
                  </h4>
                  <p className="text-gray-700">{selectedScheme.description}</p>
                </div>
              )}

              {selectedScheme.benefits && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {t("benefits")}
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedScheme.benefits}</p>
                </div>
              )}

              {selectedScheme.eligibility && (
                <div>
                  <h4 className="font-semibold mb-2">{t("eligibilityCriteria")}</h4>
                  {Array.isArray(selectedScheme.eligibility) ? (
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedScheme.eligibility.map((criteria, idx) => (
                        <li key={idx}>{criteria}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedScheme.eligibility}</p>
                  )}
                </div>
              )}

              {selectedScheme.applicationProcess && (
                <div>
                  <h4 className="font-semibold mb-2">{t("howToApply")}</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedScheme.applicationProcess}</p>
                </div>
              )}

              {selectedScheme.requiredDocuments && selectedScheme.requiredDocuments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t("requiredDocuments")}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {selectedScheme.requiredDocuments.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedScheme.budgetAmount && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-1">{t("budgetAllocation")}</h4>
                  <p className="text-2xl font-bold text-green-600">{selectedScheme.budgetAmount}</p>
                </div>
              )}

              {selectedScheme.deadline && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold mb-1">{t("applicationDeadline")}</h4>
                  <p className="text-lg font-semibold text-red-600">
                    {new Date(selectedScheme.deadline).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {selectedScheme.contactInfo && (
                <div>
                  <h4 className="font-semibold mb-2">{t("contactInformation")}</h4>
                  <div className="space-y-1 text-sm text-gray-700">
                    {selectedScheme.contactInfo.phone && (
                      <p>📞 {t("phone")}: {selectedScheme.contactInfo.phone}</p>
                    )}
                    {selectedScheme.contactInfo.email && (
                      <p>📧 {t("email")}: {selectedScheme.contactInfo.email}</p>
                    )}
                    {selectedScheme.contactInfo.address && (
                      <p>📍 {t("address")}: {selectedScheme.contactInfo.address}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedScheme.officialWebsite && (
                <Button
                  onClick={() => window.open(selectedScheme.officialWebsite, '_blank')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t("visitOfficialWebsite")}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </DashboardLayout>
  );
}

