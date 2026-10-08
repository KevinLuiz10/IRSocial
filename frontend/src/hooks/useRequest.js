import { useCallback, useEffect, useRef, useState } from "react";

// Busca dados assíncronos e expõe { data, error, loading, retry }.
// `chave` identifica a requisição: quando muda, uma nova busca é feita.
// Enquanto carrega, `data` mantém o resultado anterior (útil na paginação).
export function useRequest(fetcher, chave) {
  const fetcherRef = useRef(fetcher);
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState({ id: null, data: null, error: null });

  const id = `${chave}#${tentativa}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let ativo = true;
    fetcherRef.current().then(
      (data) => ativo && setEstado({ id, data, error: null }),
      (error) => ativo && setEstado((anterior) => ({ id, data: anterior.data, error }))
    );
    return () => {
      ativo = false;
    };
  }, [id]);

  const retry = useCallback(() => setTentativa((t) => t + 1), []);

  return {
    data: estado.data,
    error: estado.id === id ? estado.error : null,
    loading: estado.id !== id,
    retry,
  };
}
