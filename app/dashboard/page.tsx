'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react';
import { SimpleNavbar } from '@/components/ui/navbar';

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function DashboardPage() {
  const [licenseKey, setLicenseKey] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  // Load campaigns on mount
  useEffect(() => {
    if (licenseKey) {
      loadCampaigns();
    }
  }, [licenseKey]);

  const loadCampaigns = async () => {
    if (!licenseKey) return;
    
    try {
      const response = await fetch('/api/campaigns', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${licenseKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const createCampaign = async () => {
    if (!licenseKey || !newCampaignName.trim()) {
      alert('Please enter a license key and campaign name');
      return;
    }

    setIsCreatingCampaign(true);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey,
          name: newCampaignName,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setNewCampaignName('');
        await loadCampaigns();
        setSelectedCampaign(data.campaignId);
        alert('Campaign created successfully!');
      } else {
        alert(`Error: ${data.error || 'Failed to create campaign'}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const parseCSV = (text: string): Array<Record<string, string>> => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Parse rows
    const rows: Array<Record<string, string>> = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    
    return rows;
  };

  const mapCSVToContacts = (csvRows: Array<Record<string, string>>) => {
    return csvRows.map(row => {
      // Flexible column mapping - try different possible column names
      const nome = row.nome || row.name || row.Nome || row.Name || '';
      const empresa = row.empresa || row.company || row.Empresa || row.Company || '';
      const cargo = row.cargo || row.job_title || row.cargo || row.Cargo || '';
      const site = row.site || row.website || row.Site || row.Website || '';
      const dor_especifica = row.dor_especifica || row.pain_point || row.Dor_Especifica || '';
      const phone = row.phone || row.telefone || row.Phone || row.Telefone || '';

      return {
        nome: nome.trim(),
        empresa: empresa.trim(),
        cargo: cargo.trim() || undefined,
        site: site.trim() || undefined,
        dor_especifica: dor_especifica.trim() || undefined,
        phone: phone.trim(),
      };
    }).filter(contact => contact.nome && contact.empresa && contact.phone);
  };

  const handleFileUpload = async () => {
    if (!csvFile || !selectedCampaign || !licenseKey) {
      alert('Please select a CSV file, campaign, and enter your license key');
      return;
    }

    setIsLoading(true);
    setImportResult(null);

    try {
      const text = await csvFile.text();
      const csvRows = parseCSV(text);
      const contacts = mapCSVToContacts(csvRows);

      if (contacts.length === 0) {
        alert('No valid contacts found in CSV. Please check the format.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/campaigns/${selectedCampaign}/import-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey,
          contacts,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult(result);
        setCsvFile(null);
        // Reset file input
        const fileInput = document.getElementById('csv-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        alert(`Error: ${result.error || 'Failed to import CSV'}`);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Failed to import CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SimpleNavbar />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            LK Lead Outreach - Dashboard
          </h1>

          {/* License Key Input */}
          <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              License Key
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="Enter your license key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter your license key to access campaigns
            </p>
          </div>

          {/* Create Campaign */}
          <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Campaign
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="Campaign name (e.g., 'Q1 2025 Outreach')"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                onKeyPress={(e) => e.key === 'Enter' && createCampaign()}
              />
              <button
                onClick={createCampaign}
                disabled={isCreatingCampaign || !newCampaignName.trim()}
                className="px-6 py-2 bg-gradient-to-r from-slate-700 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreatingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Campaign Selection */}
          {campaigns.length > 0 && (
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Campaign
              </label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">-- Select a campaign --</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} ({campaign.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* CSV Import */}
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import CSV File
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CSV File Format
              </label>
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm">
                <p className="text-gray-600 mb-2">Your CSV should have these columns:</p>
                <code className="block bg-gray-50 p-2 rounded text-xs">
                  nome, empresa, cargo, site, dor_especifica, phone
                </code>
                <p className="text-gray-500 text-xs mt-2">
                  <strong>Required:</strong> nome, empresa, phone<br />
                  <strong>Optional:</strong> cargo, site, dor_especifica
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {csvFile && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {csvFile.name}
                </p>
              )}
            </div>

            <button
              onClick={handleFileUpload}
              disabled={!csvFile || !selectedCampaign || !licenseKey || isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-slate-700 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Import CSV
                </>
              )}
            </button>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className={`p-6 rounded-xl border-2 ${
              importResult.imported > 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                {importResult.imported > 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-yellow-600" />
                )}
                Import Results
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold text-green-600">Imported:</span> {importResult.imported} leads
                </p>
                {importResult.skipped > 0 && (
                  <p className="text-sm">
                    <span className="font-semibold text-yellow-600">Skipped:</span> {importResult.skipped} leads
                  </p>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-red-600 mb-2">Errors:</p>
                    <ul className="text-xs text-gray-700 bg-white p-3 rounded max-h-40 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index} className="mb-1">• {error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li className="text-gray-500">... and {importResult.errors.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CSV Example */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">CSV Example:</h3>
            <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
{`nome,empresa,cargo,site,dor_especifica,phone
João Silva,Empresa ABC,CEO,https://empresaabc.com.br,Necessita aumentar vendas,+5511999999999
Maria Santos,Tech Solutions,CTO,https://techsol.com.br,Melhorar processos,+5511888888888`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
