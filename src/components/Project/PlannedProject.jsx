import React, { useEffect, useState } from 'react';
import projectAPI from '../../api/project';

export default function PlannedProject() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await projectAPI.getByStatus('planned');
                if (mounted) setProjects(Array.isArray(res) ? res : (res.items || []));
            } catch (err) {
                if (mounted) setError(err.message || 'Failed to load projects');
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, []);

    if (loading) return <div>Loading planned projects...</div>;
    if (error) return <div className="text-red-600">Error: {error}</div>;

    return (
        <div>
            <h2 className="text-lg font-semibold mb-2">Planned Projects</h2>
            {projects.length === 0 ? (
                <div>No planned projects found.</div>
            ) : (
                <ul className="space-y-2">
                    {projects.map((p) => (
                        <li key={p.id} className="p-3 border rounded">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-medium">{p.name || `Project #${p.id}`}</div>
                                    <div className="text-sm text-gray-600">ID: {p.id} • Contract: {p.contract_id ?? '—'} • Team: {p.team_id ?? '—'}</div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}