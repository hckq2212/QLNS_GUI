// components/AssignedContract.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import {
  useGetContractsByStatusQuery,
  useUploadSignedContractMutation,
} from '../../services/contract.js';
import { useGetCustomerByIdQuery } from '../../services/customer';



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
    <div className="p-3 border rounded">
      <div className="font-medium">{contract.code || contract.title || `#${contract.id}`}</div>
      <div className="text-sm text-gray-700">Khách hàng: {displayCustomer}</div>
      <div className="text-sm text-gray-600">Trạng thái: {contract.status || contract.state || '—'}</div>

      <div className="mt-2 flex items-center gap-2">
        <input type="file" accept=".pdf" onChange={(e) => setLocalFile(e.target.files[0])} />
        <button
          className="px-2 py-1 bg-indigo-600 text-white rounded"
          disabled={uploading || !localFile}
          onClick={async () => {
            try {
              await uploadSigned({ id: contract.id, file: localFile }).unwrap();
              alert('Upload thành công');
            } catch (err) {
              console.error(err);
              alert('Upload thất bại');
            }
          }}
        >
          {uploading ? 'Đang tải...' : 'Upload file đã ký'}
        </button>
      </div>

      {Array.isArray(contract.services) && contract.services.length > 0 && (
        <div className="mt-2">
          <div className="text-sm font-medium">Dịch vụ:</div>
          <ul className="mt-1 text-sm list-disc list-inside space-y-1">
            {contract.services.map((s) => (
              <li key={s.id || s._id || s.service_id}>
                {s.name || s.service_name || s.title || `#${s.service_id || s.id || s._id}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
      <h3 className="font-semibold mb-3">Hợp đồng đã phân công</h3>
      {isLoading ? (
        <div className="text-sm text-gray-500">Đang tải...</div>
      ) : isError ? (
        <div className="text-sm text-red-600">{error?.data?.message || 'Lỗi tải dữ liệu'}</div>
      ) : contracts.length === 0 ? (
        <div className="text-sm text-gray-600">Không có hợp đồng đã phân công</div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <ContractRow key={c.id} contract={c} />
          ))}
        </div>
      )}
    </div>
  );
}
