import React from 'react';
import { BloodTest } from '@/hooks/useBloodTests';

interface BloodTestsCardProps {
  bloodTests: BloodTest[];
  bloodTestsLoading: boolean;
  bloodTestsError: any;
  onNew: () => void;
  onEdit: (test: BloodTest) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function Item({ label, value, unit }: { label: string; value: number | null | undefined; unit?: string }) {
  const display = value ?? '—';
  return (
    <div className="bg-gray-50 p-2 rounded">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">
        {display}{unit ? ` ${unit}` : ''}
      </div>
    </div>
  );
}

export default function BloodTestsCard({ bloodTests, bloodTestsLoading, bloodTestsError, onNew, onEdit, onDelete }: BloodTestsCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">Exames de Sangue</h2>
          <span className="text-gray-500 text-base md:text-lg mt-1 md:mt-0">Histórico de Exames Laboratoriais</span>
        </div>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 font-semibold"
          onClick={onNew}
        >
          Novo Exame
        </button>
      </div>

      {/* Conteúdo */}
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-4 pr-2">
          {bloodTestsLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p>Carregando exames de sangue...</p>
            </div>
          ) : bloodTestsError ? (
            <div className="text-center py-8 text-red-500">
              <div className="mb-2">⚠️</div>
              <p>Erro ao carregar exames de sangue.</p>
              <p className="text-sm text-gray-500 mt-1">Tente recarregar a página.</p>
            </div>
          ) : bloodTests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-2">🩸</div>
              <p>Nenhum exame de sangue registrado ainda.</p>
              <p className="text-sm">Clique em "Novo Exame" para adicionar o primeiro exame.</p>
              <p className="text-xs text-blue-500 mt-2">Debug: Array length = {bloodTests.length}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {bloodTests.map((test, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">Exame de {formatDate(test.test_date)}</h3>
                      <p className="text-sm text-gray-500">{test.laboratory && `Laboratório: ${test.laboratory}`}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => onEdit(test)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        onClick={() => onDelete(test.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  {/* Categorias agrupadas */}
                  {/* Hemograma */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">Hemograma</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="Hemoglobina" value={test.hemoglobin} unit="g/dL" />
                      <Item label="Hematócrito" value={test.hematocrit} unit="%" />
                      <Item label="Hemácias" value={test.red_blood_cells} unit="milhões/μL" />
                      <Item label="Leucócitos" value={test.white_blood_cells} unit="/μL" />
                      <Item label="Plaquetas" value={test.platelets} unit="/μL" />
                    </div>
                  </div>

                  {/* Índices Hematimétricos */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">Índices Hematimétricos</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="VCM" value={test.vch} unit="fL" />
                      <Item label="HCM" value={test.hcm} unit="pg" />
                      <Item label="CHCM" value={test.chcm} unit="g/dL" />
                      <Item label="RDW" value={test.rdw} unit="%" />
                    </div>
                  </div>

                  {/* Diferencial de Leucócitos (%) */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">Diferencial de Leucócitos (%)</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="Basófilos" value={test.basophils_percent} unit="%" />
                      <Item label="Eosinófilos" value={test.eosinophils_percent} unit="%" />
                      <Item label="Mielócitos" value={test.myelocytes_percent} unit="%" />
                      <Item label="Metamielócitos" value={test.metamyelocytes_percent} unit="%" />
                      <Item label="Bastões" value={test.bands_percent} unit="%" />
                      <Item label="Neutrófilos Segmentados" value={test.segmented_neutrophils_percent} unit="%" />
                      <Item label="Linfócitos" value={test.lymphocytes_percent} unit="%" />
                      <Item label="Monócitos" value={test.monocytes_percent} unit="%" />
                    </div>
                  </div>

                  {/* Hormônios */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">Hormônios</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="Testosterona Total" value={test.testosterone_total} unit="ng/dL" />
                      <Item label="Testosterona Livre" value={test.testosterone_free} unit="pg/mL" />
                      <Item label="SHBG" value={test.shbg} unit="nmol/L" />
                      <Item label="TSH" value={test.tsh} unit="μUI/mL" />
                      <Item label="T3" value={test.t3} unit="ng/dL" />
                      <Item label="T4" value={test.t4} unit="μg/dL" />
                      <Item label="T4 Livre" value={test.t4_free} unit="ng/dL" />
                      <Item label="Estradiol" value={test.estradiol} unit="pg/mL" />
                    </div>
                  </div>

                  {/* PSA */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">PSA</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="PSA Total" value={test.psa_total} unit="ng/mL" />
                      <Item label="PSA Livre" value={test.psa_free} unit="ng/mL" />
                      <Item label="Relação PSA Livre/Total" value={test.psa_ratio} unit="" />
                    </div>
                  </div>

                  {/* Lipidograma */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">Lipidograma</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="Colesterol Total" value={test.cholesterol_total} unit="mg/dL" />
                      <Item label="HDL" value={test.hdl} unit="mg/dL" />
                      <Item label="LDL" value={test.ldl} unit="mg/dL" />
                      <Item label="Triglicerídeos" value={test.triglycerides} unit="mg/dL" />
                      <Item label="VLDL" value={test.vldl} unit="mg/dL" />
                      <Item label="Apolipoproteína A" value={test.apolipoprotein_a} unit="mg/dL" />
                      <Item label="Apolipoproteína B" value={test.apolipoprotein_b} unit="mg/dL" />
                    </div>
                  </div>

                  {/* Vitaminas e Metabolismo */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">Vitaminas e Metabolismo</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="Vitamina D" value={test.vitamin_d} unit="ng/mL" />
                      <Item label="Vitamina B12" value={test.vitamin_b12} unit="pg/mL" />
                      <Item label="Homocisteína" value={test.homocysteine} unit="μmol/L" />
                      <Item label="Folato" value={test.folate} unit="ng/mL" />
                      <Item label="Ferritina" value={test.ferritin} unit="ng/mL" />
                      <Item label="Ácido Úrico" value={test.uric_acid} unit="mg/dL" />
                    </div>
                  </div>

                  {/* Função Renal */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">Função Renal</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="Creatinina" value={test.creatinine} unit="mg/dL" />
                      <Item label="Ureia" value={test.urea} unit="mg/dL" />
                    </div>
                  </div>

                  {/* Função Hepática */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">Função Hepática</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="TGO/AST" value={test.tgo_ast} unit="U/L" />
                      <Item label="TGP/ALT" value={test.tgp_alt} unit="U/L" />
                      <Item label="Proteínas Totais" value={test.total_protein} unit="g/dL" />
                      <Item label="Albumina" value={test.albumin} unit="g/dL" />
                      <Item label="Bilirrubina Total" value={test.bilirubin_total} unit="mg/dL" />
                      <Item label="Bilirrubina Direta" value={test.bilirubin_direct} unit="mg/dL" />
                      <Item label="Bilirrubina Indireta" value={test.bilirubin_indirect} unit="mg/dL" />
                      <Item label="Fosfatase Alcalina" value={test.alkaline_phosphatase} unit="U/L" />
                      <Item label="GGT" value={test.ggt} unit="U/L" />
                      <Item label="LDH" value={test.ldh} unit="U/L" />
                      <Item label="Proteína C Reativa" value={test.c_reactive_protein} unit="mg/L" />
                    </div>
                  </div>

                  {/* Eletrólitos */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">Eletrólitos</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="Sódio" value={test.sodium} unit="mEq/L" />
                      <Item label="Potássio" value={test.potassium} unit="mEq/L" />
                      <Item label="Magnésio" value={test.magnesium} unit="mg/dL" />
                      <Item label="Fósforo" value={test.phosphorus} unit="mg/dL" />
                    </div>
                  </div>

                  {/* Glicemia */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-red-800 mb-1">Glicemia</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Item label="Glicose" value={test.glucose} unit="mg/dL" />
                      <Item label="Glicose em Jejum" value={test.fasting_glucose} unit="mg/dL" />
                      <Item label="HbA1c" value={test.hba1c} unit="%" />
                      <Item label="Insulina em Jejum" value={test.fasting_insulin} unit="μU/mL" />
                    </div>
                  </div>

                  {test.notes && (
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <div className="text-xs text-blue-600 font-medium">Observações:</div>
                      <div className="text-sm text-blue-800">{test.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}