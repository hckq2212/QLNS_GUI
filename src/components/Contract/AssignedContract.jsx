// components/AssignedContract.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import {
  useGetContractsByStatusQuery,
  useUploadSignedContractMutation,
  useGetContractServicesQuery,
} from '../../services/contract.js';
import { useGetCustomerByIdQuery } from '../../services/customer';
import { toast } from 'react-toastify';
import { formatPrice } from '../../utils/FormatValue.js';



function ContractRow({ contract }) {

  const cid = contract.customer_id;
  const hasCustomer = contract.customer?.name;
  const { data: customerData } = useGetCustomerByIdQuery(cid, {
    skip: !cid || hasCustomer,
  });

  const [uploadSigned, { isLoading: uploading }] = useUploadSignedContractMutation();
  const [localFile, setLocalFile] = React.useState(null);
  const displayCustomer =
    contract.customer?.name ||
    customerData?.name ||
    contract.customerName ||
    contract.customer_temp ||
    '—';



  return (
    <tr className="border-t">
      <td className="px-4 py-3 align-top font-medium">{contract.code || contract.title || `#${contract.id}`}</td>
      <td className="px-4 py-3 align-top text-sm text-gray-700">{displayCustomer}</td>
      <td className="px-4 py-3 align-top text-sm text-gray-700">{formatPrice(contract.total_cost)}</td>
      <td className="px-4 py-3 align-top text-sm text-gray-700">{formatPrice(contract.total_revenue)}</td>
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-2">
          <input type="file" accept=".pdf" onChange={(e) => setLocalFile(e.target.files[0])} />
          <button
            className="px-2 py-1 bg-indigo-600 text-white rounded"
            disabled={uploading || !localFile}
            onClick={async () => {
              try {
                await uploadSigned({ id: contract.id, file: localFile }).unwrap();
                toast.success('Upload thành công');
                setLocalFile(null);
              } catch (err) {
                console.error(err);
                toast.error(err?.data?.message || err?.message || 'Upload thất bại');
              }
            }}
          >
            {uploading ? 'Đang tải...' : 'Upload'}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AssignedContract() {
const token = useSelector((s) => s.auth.accessToken);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetContractsByStatusQuery('assigned', {
    skip: !token, // chưa có token thì khoan gọi để tránh 401
  });

  const contracts = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];
  

  return (
    <div className="p-4">
      {isLoading ? (
        <div className="text-sm text-gray-500">Đang tải...</div>
      ) : isError ? (
        <div className="text-sm text-red-600">{error?.data?.message || 'Lỗi tải dữ liệu'}</div>
      ) : contracts.length === 0 ? (
        <div className="text-sm text-gray-600">Không có hợp đồng đã phân công</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded border">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Hợp đồng</th>
                <th className="px-4 py-2">Khách hàng</th>
                <th className="px-4 py-2">Tổng vốn (dự kiến)</th>
                <th className="px-4 py-2">Tổng lợi nhuận (dự kiến)</th>
                <th className="px-4 py-2">Upload hợp đồng đã ký</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <ContractRow key={c.id} contract={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
