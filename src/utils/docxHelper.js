// Robust helper to dynamically import `docx` and generate a .docx Blob for a contract object.
// Handles multiple `docx` export shapes and packer API differences.
export async function generateContractDocxBlob(contract = {}) {
  // dynamic import
  let mod;
  try {
    mod = await import('docx');
  } catch (err) {
    // docx not installed or failed to load
    throw new Error('docx import failed: ' + (err?.message || err));
  }

  // support both ESM default and named export shapes
  const docx = mod.default && Object.keys(mod).length === 1 ? mod.default : mod;
  const Document = docx.Document || docx.Doc || null;
  const Packer = docx.Packer || docx.Pack || null;
  const Paragraph = docx.Paragraph || docx.Paragraph || null;
  const Table = docx.Table || docx.Table || null;
  const TableRow = docx.TableRow || docx.TableRow || null;
  const TableCell = docx.TableCell || docx.TableCell || null;
  const TextRun = docx.TextRun || docx.TextRun || null;
  const WidthType = docx.WidthType || docx.WidthType || null;

  if (!Document || !Packer || !Paragraph || !TextRun) {
    throw new Error('docx library does not expose expected constructors');
  }

  // prepare content
  const contractCode = contract.code || contract.contract_number || String(contract.id || '');
  const customerName = contract.customer?.name || contract.customer_name || contract.customer_temp || '';
  const description = contract.description || '';
  const items = contract.items || contract.services || contract.contract_items || contract.line_items || contract.jobs || [];

  // build children
  const headerChildren = [
    new Paragraph({ children: [new TextRun({ text: `Contract: ${contractCode}`, bold: true })] }),
    new Paragraph({ text: `Customer: ${customerName}` }),
  ];
  if (description) headerChildren.push(new Paragraph({ text: `Description: ${description}` }));
  headerChildren.push(new Paragraph({ text: 'Items:' }));

  // table
  const rows = [];
  rows.push(new TableRow({ children: [
    new TableCell({ children: [new Paragraph('No.')] }),
    new TableCell({ children: [new Paragraph('Name')] }),
    new TableCell({ children: [new Paragraph('Qty')] }),
    new TableCell({ children: [new Paragraph('Unit Price')] }),
    new TableCell({ children: [new Paragraph('Amount')] }),
  ] }));

  if (Array.isArray(items) && items.length > 0) {
    items.forEach((it, idx) => {
      const name = it.name || it.service_name || it.title || `Item ${idx + 1}`;
      const qty = it.quantity ?? it.qty ?? it.count ?? '';
      const unit = it.unit_price ?? it.unitPrice ?? it.price ?? '';
      const amount = it.amount ?? (qty && unit ? (Number(qty) * Number(unit)) : it.total) ?? '';
      rows.push(new TableRow({ children: [
        new TableCell({ children: [new Paragraph(String(idx + 1))] }),
        new TableCell({ children: [new Paragraph(String(name))] }),
        new TableCell({ children: [new Paragraph(String(qty))] }),
        new TableCell({ children: [new Paragraph(String(unit))] }),
        new TableCell({ children: [new Paragraph(String(amount))] }),
      ] }));
    });
  } else {
    rows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph('No items')], columnSpan: 5 })] }));
  }

  const table = new Table({ rows });

  const doc = new Document({ sections: [{ children: [...headerChildren, table] }] });

  // pack to blob with multiple fallbacks
  let blob;
  try {
    if (typeof Packer.toBlob === 'function') {
      blob = await Packer.toBlob(doc);
    } else if (typeof Packer.toBuffer === 'function') {
      const buf = await Packer.toBuffer(doc);
      blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    } else {
      // try instance
      const p = new Packer();
      if (typeof p.toBlob === 'function') {
        blob = await p.toBlob(doc);
      } else if (typeof p.toBuffer === 'function') {
        const buf = await p.toBuffer(doc);
        blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      } else {
        throw new Error('No packer method available');
      }
    }
  } catch (err) {
    throw new Error('docx packing failed: ' + (err?.message || err));
  }

  return blob;
}

export default generateContractDocxBlob;
