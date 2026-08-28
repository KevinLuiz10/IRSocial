import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null)

  useEffect(() => {
    // Como o front e o back rodam na mesma porta via Docker, a chamada é direta
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Fundação IRSocial 🚀</h1>
      <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <h3>Status da Comunicação:</h3>
        {data ? (
          <>
            <p><strong>Mensagem:</strong> {data.status}</p>
            <p><strong>Horário do Banco:</strong> {data.db_time}</p>
          </>
        ) : (
          <p>Conectando ao backend...</p>
        )}
      </div>
    </div>
  )
}

export default App