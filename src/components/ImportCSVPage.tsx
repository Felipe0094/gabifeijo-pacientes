
import React from 'react';
import CSVImport from './CSVImport';

const ImportCSVPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Importar Dados da Balança
        </h1>
        <p className="text-lg text-gray-600">
          Importe dados da balança Tanita BC-601 ou faça upload de arquivos CSV manuais
        </p>
      </div>

      <CSVImport patientId={0} />
    </div>
  );
};

export default ImportCSVPage;
