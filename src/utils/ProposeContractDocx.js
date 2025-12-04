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


  const h2 = (vi, en) => ([
    new Paragraph({
      spacing: { before: 240, after: 120 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: vi, bold: true })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: en, bold: true, italics: true })],
    }),
  ]);

  const dualPara = (vi, en, opts = {}) =>
    new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      spacing: { after: opts.after ?? 120 },
      children: [
        new TextRun({ text: vi }),
        new TextRun({ text: en, break: 1, italics: true }),
      ],
    });

  const kvRow = (labelVi, labelEn, valueVi, valueEn) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          children: [new Paragraph({
            children: [
              new TextRun({ text: labelVi + ' ', bold: true }),
              new TextRun({ text: labelEn, italics: true }),
            ],
          })],
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          children: [new Paragraph({
            children: [
              new TextRun({ text: valueVi }),
              ...(valueEn ? [new TextRun({ text: valueEn, break: 1, italics: true })] : []),
            ],
          })],
        }),
      ],
    });

  const makeTable = (rows, opts = {}) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top:    { style: BorderStyle.SINGLE, size: opts.borderTop ?? 0 },
        bottom: { style: BorderStyle.NONE },
        left:   { style: BorderStyle.NONE },
        right:  { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical:   { style: BorderStyle.NONE },
      },
      rows,
    });

    const contactRow = (labelVi, labelEn, name, phone, email) =>
  new TableRow({
    children: [
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        children: [new Paragraph({
          children: [
            new TextRun({ text: labelVi + ' ', bold: true }),
            new TextRun({ text: labelEn, italics: true })
          ]
        })],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ text: name })],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ text: phone })],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ text: email })],
      }),
    ],
  });

    

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

// ===== Party A block =====
  children.push(...h2('Bên sử dụng dịch vụ (Bên A)', 'The Service Recipient (Party A)'));
  children.push(makeTable([
    kvRow('Tên pháp lý/ Legal name', '', '', ''),
    kvRow('Đại diện/ Representative', '', '', ''),
    kvRow('Chức vụ/ Position', '', '', ''),
    kvRow('Theo G/UQ số', 'Power of Attorney No.', '04.2021/GUQ-LM ngày 26/3/2021', '04.2021/GUQ-LM dated March 26, 2021'),
    kvRow('Địa chỉ/ Address', '', '', ''),
    kvRow('Mã số thuế/ Tax ID', '', '', ''),
    kvRow('Điện thoại/ Phone', '', '', ''),
    contactRow(
        'Đại diện liên hệ thanh toán',
        'Payment contact representative',
        'Lương Nguyễn Ngọc Nga',
        '039 414 6826',
        'nga.lnn@lemay.com.vn'
    ),
    kvRow('Đại diện liên hệ triển khai', 'Implementation contact representative', 'Lương Nguyễn Ngọc Nga — 039 414 6826 — nga.lnn@lemay.com.vn', ''),
  ]));
  // (Nguồn dữ liệu bên A) :contentReference[oaicite:6]{index=6}

  // ===== Party B block =====
  children.push(...h2('Bên cung cấp dịch vụ (Bên B)', 'The Service Provider (Party B)'));
  children.push(makeTable([
    kvRow('Tên pháp lý/ Legal name', '', 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TRUYỀN THÔNG KỸ THUẬT SỐ GETVINI', 'GETVINI DIGITAL MEDIA SERVICES TRADING COMPANY LIMITED'),
    kvRow('Đại diện/ Representative', '', 'VÕ THỊ KIỀU NHI', 'Ms. VO THI KIEU NHI'),
    kvRow('Chức vụ/ Position', '', 'Giám đốc điều hành', 'General director'),
    kvRow('Địa chỉ/ Address', '', '17 Đường số 53, Phường Tân Hưng, TP. HCM, Việt Nam', '17 Street No. 53, Tan Hung Ward, Ho Chi Minh City, Vietnam'),
    kvRow('Mã số thuế/ Tax ID', '', '0316862464', ''),
    kvRow('Điện thoại/ Phone', '', '0767 9191 01', ''),
    kvRow('Số tài khoản/ Account number', '', '23502737 (ACB)', 'Opened at: Asia Commercial Joint Stock Bank'),
  ])); // :contentReference[oaicite:7]{index=7}

  children.push(dualPara(
    'Bên A và Bên B được gọi chung là “Các Bên” hoặc “Hai Bên” và được gọi riêng là “Bên”.',
    'Party A and Party B are collectively referred to as “The Parties” or “Both Parties” and individually referred to as “Party”.',
  )); // :contentReference[oaicite:8]{index=8}

  // ===== ARTICLE 1. DEFINITIONS =====
  children.push(...h2('ĐIỀU 1. ĐỊNH NGHĨA', 'ARTICLE 1. DEFINITIONS'));
  children.push(dualPara(
    'Trong Hợp Đồng này, các từ/cụm từ dưới đây được định nghĩa như sau:',
    'In this Contract, the following terms shall have the meanings ascribed to them below:'
  )); // :contentReference[oaicite:9]{index=9}
  children.push(dualPara('Dịch Vụ/ Service: Là các công việc/dịch vụ mà Bên A đề nghị và Bên B đồng ý thực hiện.',
                         'Services: Tasks/services that Party A proposes and Party B agrees to perform.'));
  children.push(dualPara('Phí Dịch Vụ/ Service Fee: Là số tiền Bên A sẽ thanh toán cho Bên B theo Hợp Đồng này.',
                         'Service Fee: The amount Party A shall pay Party B as stipulated in this Contract.'));
  children.push(dualPara('Ngày Làm Việc/ Working Days: Là các ngày dương lịch không bao gồm chủ nhật, ngày lễ, Tết…',
                         'Working Days: Calendar days excluding Sundays, public holidays, Tet holidays, or other statutory non-working days.')); // :contentReference[oaicite:10]{index=10}

  // ===== ARTICLE 2. PROVIDED SERVICES + PROJECT INFO =====
  children.push(...h2('ĐIỀU 2. DỊCH VỤ CUNG CẤP', 'ARTICLE 2. PROVIDED SERVICES'));
  children.push(dualPara('Tổng quan dự án/ Project overview', ''));
  children.push(makeTable([
    kvRow('Tên dự án/ Project name', '', 'GET – MORINAGA', ''),
    kvRow('Gói Dịch Vụ/ Service package', '', 'Sản xuất video/ Video production', ''),
    kvRow('Công ty/ Agency', '', 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TRUYỀN THÔNG KỸ THUẬT SỐ GETVINI', ''),
    kvRow('Thời gian thực hiện/ Service period', '', '45 ngày (bao gồm sản xuất & nghiệm thu)', '45 days incl. production & acceptance'),
    kvRow('Thời hạn bàn giao', 'Delivery deadline', 'Theo kế hoạch triển khai đính kèm', 'According to the attached implementation plan'),
    kvRow('Phương thức bàn giao', 'Delivery method', 'Qua Google Drive; lưu link 30 ngày', 'Via Google Drive; link retained for 30 days'),
  ])); // :contentReference[oaicite:11]{index=11}

  // (Bạn có thể thêm bảng nội dung/hạng mục chi tiết ở đây theo cùng pattern nếu muốn đưa vào DOCX.)

  // ===== ARTICLE 4. SERVICE FEE =====
  children.push(...h2('ĐIỀU 4. PHÍ DỊCH VỤ', 'ARTICLE 4. SERVICE FEE'));
  children.push(dualPara(
    'Phí Dịch Vụ (Giá trị Hợp Đồng): 77,000,000 VND (Bằng chữ: Bảy mươi bảy triệu Việt Nam đồng, chưa bao gồm VAT).',
    'Service fee (Contract value): 77,000,000 VND (In words: Seventy-seven million Vietnamese Dong, excluding VAT).'
  ));
  children.push(dualPara(
    'Thuế VAT (8%): 6,160,000 VND (Bằng chữ: Sáu triệu một trăm sáu mươi nghìn Việt Nam đồng).',
    'The VAT (8%): 6,160,000 VND (In words: Six million one hundred and sixty thousand Vietnamese Dong).'
  ));
  children.push(dualPara(
    'Tổng giá trị Hợp Đồng: 83,160,000 VND (Bằng chữ: Tám mươi ba triệu một trăm sáu mươi nghìn Việt Nam đồng, đã bao gồm VAT).',
    'Total Contract value: 83,160,000 VND (In words: Eighty-three million one hundred and sixty thousand Vietnamese Dong, VAT included).'
  )); // :contentReference[oaicite:12]{index=12}

  // ===== ARTICLE 5. PAYMENT =====
  children.push(...h2('ĐIỀU 5. THANH TOÁN', 'ARTICLE 5. PAYMENT'));
  children.push(dualPara('Thời hạn thanh toán/ Payment deadline', ''));
  children.push(dualPara(
    'Thanh toán đợt 01: Bên A thanh toán 50% tổng giá trị (đã gồm VAT) trong vòng 15 ngày kể từ ngày ký và nhận đủ hồ sơ (Đề nghị thanh toán; Hóa đơn VAT hợp pháp).',
    'First installment: Party A pays 50% of total value (incl. VAT) within 15 days from signing date and receipt of complete documents (Payment request; Legal VAT invoice).'
  )); // :contentReference[oaicite:13]{index=13}
  children.push(dualPara(
    'Thanh toán đợt 02: Bên A thanh toán phần còn lại sau khi nghiệm thu; thời gian thanh toán là 03 ngày kể từ khi nhận đủ hồ sơ (Hóa đơn VAT; Biên bản nghiệm thu).',
    'Second installment: Party A pays the remaining amount after acceptance; payment period is 03 days from receipt of complete documents (VAT invoice; Acceptance report).'
  )); // :contentReference[oaicite:14]{index=14}
  children.push(dualPara(
    'Hình thức thanh toán: Chuyển khoản VNĐ vào tài khoản của Bên B nêu tại phần đầu Hợp Đồng.',
    'Payment method: Bank transfer in VND to Party B’s bank account specified in the preamble.'
  )); // :contentReference[oaicite:15]{index=15}

  // ===== Signatures =====
  children.push(...h2('KÝ XÁC NHẬN', 'SIGNATURES'));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'ĐẠI DIỆN BÊN A', bold: true })] }),
              new Paragraph({ children: [new TextRun({ text: 'REPRESENTATIVE OF PARTY A', italics: true, bold: true })] }),
              new Paragraph({ spacing: { before: 720, after: 120 }, children: [new TextRun({ text: '' })] }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'ĐẠI DIỆN BÊN B', bold: true })] }),
              new Paragraph({ children: [new TextRun({ text: 'REPRESENTATIVE OF PARTY B', italics: true, bold: true })] }),
              new Paragraph({ spacing: { before: 720, after: 120 }, children: [new TextRun({ text: ''})] }),
            ],
          }),
        ],
      }),
    ],
  }));

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
