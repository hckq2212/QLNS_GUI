import { Indent, PageMargin } from 'docx';

export default async function ProposeContractDocx(data = {}) {
  // Import động docx
  let mod;
  try { mod = await import('docx'); }
  catch (e) { throw new Error('Cannot import docx: ' + (e?.message || e)); }

  const docx = mod.default && Object.keys(mod).length === 1 ? mod.default : mod;
  const {
    Document, Packer, Paragraph, TextRun,
    AlignmentType, HeadingLevel,
    Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, VerticalAlign
  } = docx;


  const children = [];

  // Header
  // Số hợp đồng
const contractNo = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  // gạch mảnh phía trên, không kẻ trong
  borders: {
    top: { style: BorderStyle.SINGLE, size: 8 },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  },
  rows: [
    new TableRow({
      children: [
        // Cột trái: "Số:\nNo:" — chiếm 2 hàng
        new TableCell({
          rowSpan: 2,
          width: { size: 20, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.SINGLE, size: 4 }, // đường dọc ngăn cách
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Số:", bold: true }),
                new TextRun({ text: "No:", break: 1, italics: true }),
              ],
            }),
          ],
        }),

        // Cột phải: khối merge (ô lớn), cũng chiếm 2 hàng
        new TableCell({
          rowSpan: 2,
          width: { size: 80, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({ text: "G  2  5  1  0  0  0  3", bold: true }),
               
              ],
            }),
          ],
        }),
      ],
    }),
    // Hàng 2 trống vì cả 2 ô ở hàng 1 đã rowSpan = 2
    new TableRow({ children: [] }),
  ],
});
  // Header trái 
  const headerLeft = new Paragraph({
    alignment: AlignmentType.CENTER, 
    children: [
      new TextRun({ text: 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ', bold: true }),
      new TextRun({ break: 1, text: 'TRUYỀN THÔNG KỸ THUẬT SỐ GETVINI', bold: true }),
      new TextRun({ break: 1, text: 'GETVINI DIGITAL MEDIA SERVICES', bold: true, italics: true }),
      new TextRun({ break: 1, text: 'TRADING COMPANY LIMITED', bold: true, italics: true }),
    ],
  });
//   Header phải
    const headerRight = new Paragraph({
    alignment: AlignmentType.CENTER, 
    children: [
      new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true }),
      new TextRun({ break: 1, text: 'SOCIALIST REPUBLIC OF VIETNAM', bold: true , italics: true}),
      new TextRun({ break: 1, text: 'Độc lập - Tự do - Hạnh phúc', bold: true }),
      new TextRun({ break: 1, text: 'Independence - Freedom - Happiness', bold: true, italics: true }),

    ],
  });
  
// Tiêu đề hợp đồng
    const title = new Paragraph({
        alignment: AlignmentType.CENTER, 
        children: [
        new TextRun({ text: 'HỢP ĐỒNG CUNG CẤP DỊCH VỤ TRUYỀN THÔNG', bold: true, size:36 }),
        new TextRun({ break: 1, text: 'MEDIA SERVICE CONTRACT', bold: true , italics: true, size:36}),
        ],
    });

// push Header
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
      top:    { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left:   { style: BorderStyle.NONE },
      right:  { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical:   { style: BorderStyle.NONE },
    },
    rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [headerLeft, contractNo],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [headerRight],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
      ],
    })
  );
// push title
  children.push(title)

children.push(
  new Paragraph({
    children: [
      new TextRun({ text: 'HỢP ĐỒNG CUNG CẤP DỊCH VỤ TRUYỀN THÔNG ', bold: true }),
      new TextRun({ text: 'này (“'}),
      new TextRun({ text: 'Hợp Đồng', bold: true }),
      new TextRun({ text: '”) được lập và ký kết vào ngày    tháng    năm     (“' }),
      new TextRun({ text: 'Ngày Hiệu Lực', bold: true }),
      new TextRun({ text: '”), bởi và giữa:' }),
    ],
  })
);

children.push(
  new Paragraph({
    children: [
      new TextRun({ text: 'MEDIA SERVICE CONTRACT  ', bold: true }),
      new TextRun({ text: 'này (“'}),
      new TextRun({ text: 'Hợp Đồng', bold: true }),
      new TextRun({ text: '”) được lập và ký kết vào ngày    tháng    năm     (“' }),
      new TextRun({ text: 'Ngày Hiệu Lực', bold: true }),
      new TextRun({ text: '”), bởi và giữa:' }),
    ],
  })
);

  // ---------- Document + pack ----------
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 24 },
        paragraph: { spacing: { after: 120 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 720,
            right: 446.4,
            bottom: 720,
            left: 720,
          },
        },
      },
      children,
    },
  ],
});

  // Trả về Blob (browser) hoặc Buffer (Node) tùy Packer sẵn có
  let blob;
  if (typeof Packer.toBlob === 'function') {
    blob = await Packer.toBlob(doc);
    return blob;
  }
  if (typeof Packer.toBuffer === 'function') {
    const buf = await Packer.toBuffer(doc);
    // Node 18+ có Blob toàn cục, nếu cần Blob:
    try {
      return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    } catch {
      return buf; // fallback: Buffer
    }
  }
  const pk = new Packer();
  if (typeof pk.toBlob === 'function') return await pk.toBlob(doc);
  if (typeof pk.toBuffer === 'function') {
    const buf = await pk.toBuffer(doc);
    try {
      return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    } catch {
      return buf;
    }
  }
  throw new Error('No packer method available');
}
