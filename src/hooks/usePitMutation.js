import { useSyncExternalStore, useState } from 'react';
import useAuth from './useAuth';
import api from '../api/pitApi';
import { mutationStore, confirmedThenRefresh } from '../utils/pit';
export default function usePitMutation(refresh) {
  const {
    user
  } = useAuth();
  const store = mutationStore(user?.id || user?.username);
  useSyncExternalStore(store.subscribe, store.version);
  const [notice, setNotice] = useState(''),
    [error, setError] = useState('');
  const perform = async (input, retry = false) => {
    if (store.pending) return {
      success: false,
      message: 'Another Pit operation is already in progress.'
    };
    setError('');
    setNotice('');
    try {
      await confirmedThenRefresh(() => store.run(input, api.executePitMutation, retry), refresh, () => setNotice('Operation succeeded.'), setNotice);
      return {
        success: true
      };
    } catch (e) {
      const message = store.uncertain ? 'Outcome unconfirmed. The exact target and request are retained. Resolve this operation before starting another.' : e?.response?.data?.message || e.message;
      setError(message);
      return {
        success: false,
        uncertain: store.uncertain,
        message
      };
    }
  };
  const recover = async () => {
    const op = store.operation;
    if (!op || store.pending) return;
    if (op.idempotent) return perform(null, true);
    try {
      let confirmed = false;
      if (op.kind === 'close') confirmed = (await api.getAuthoritativeTable(op.tableId)).status === 'CLOSED';
      if (op.kind === 'assign') confirmed = (await api.getAssignedPlayers(op.tableId)).some(p => p.customerSessionId === op.payload.customerSessionId);
      if (!confirmed) {
        setError('Completion could not be established. Do not repeat the request; verify the operation before continuing.');
        return;
      }
      store.confirmRecovered();
      setError('');
      setNotice('Operation completion confirmed from backend state.');
      try {
        await refresh();
      } catch {
        setNotice('Operation completion confirmed; latest state could not be refreshed.');
      }
    } catch {
      setError('Recovery read failed. The unconfirmed operation is retained.');
    }
  };
  return {
    perform,
    recover,
    notice,
    error,
    store,
    blocked: store.pending || store.uncertain
  };
}
