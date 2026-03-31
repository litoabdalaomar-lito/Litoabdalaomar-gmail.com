import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Library, CheckSquare, Languages, Bot, Settings, LogOut, Menu, X } from 'lucide-react';

// --- API Helper ---
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/';
    }
    throw new Error('API Error');
  }
  return res;
};

// --- Components ---

function Login({ setAuth }: { setAuth: (auth: any) => void }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', data.user);
        localStorage.setItem('role', data.role);
        setAuth({ loggedIn: true, user: data.user, role: data.role });
      } else {
        const err = await res.json();
        setError(err.error || 'Acesso não autorizado.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🌙 LITO Islamic Academy</h1>
          <p className="text-gray-600">Educação do Alcorão e Sunnah</p>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email/Utilizador</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[var(--color-brand-green)] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Palavra-passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[var(--color-brand-green)] outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[var(--color-brand-green)] text-white py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Entrar na Madrassa
          </button>
        </form>
      </div>
    </div>
  );
}

function Sidebar({ auth, setAuth, isOpen, setIsOpen }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    apiFetch('/api/progress')
      .then(res => res.json())
      .then(data => setProgress(data.pct))
      .catch(console.error);
  }, [location.pathname]);

  const menu = [
    { path: '/cursos', name: 'Cursos', icon: BookOpen },
    { path: '/biblioteca', name: 'Biblioteca Global', icon: Library },
    { path: '/quizzes', name: 'Testes (Quizzes)', icon: CheckSquare },
    { path: '/arabe', name: 'Aprender Árabe', icon: Languages },
    { path: '/tutor', name: 'Tutor IA', icon: Bot },
  ];

  if (auth.role === 'admin') {
    menu.push({ path: '/admin', name: 'Painel Admin', icon: Settings });
  }

  const handleLogout = () => {
    localStorage.clear();
    setAuth({ loggedIn: false, user: '', role: '' });
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-[var(--color-brand-sidebar)] shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col`}>
        <div className="p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>📚</span> ACADEMIA
          </h2>
        </div>

        <div className="px-6 mb-8">
          <p className="text-sm text-gray-600 mb-1">Teu Progresso</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-[var(--color-brand-green)]">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-[var(--color-brand-green)] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-[var(--color-brand-green)] text-white' : 'text-gray-700 hover:bg-white/50'}`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Terminar Sessão</span>
          </button>
        </div>
      </div>
    </>
  );
}

function Cursos() {
  const [aulas, setAulas] = useState<any[]>([]);
  const [selectedAula, setSelectedAula] = useState<any>(null);

  useEffect(() => {
    apiFetch('/api/aulas')
      .then(res => res.json())
      .then(data => {
        setAulas(data);
        if (data.length > 0) setSelectedAula(data[0]);
      })
      .catch(console.error);
  }, []);

  const markComplete = async () => {
    if (!selectedAula) return;
    try {
      await apiFetch(`/api/aulas/${selectedAula.id}/complete`, { method: 'POST' });
      alert('Aula marcada como concluída!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Lições de Religião</h1>
      {aulas.length === 0 ? (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg">As aulas serão publicadas em breve.</div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Escolha o Tema</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-brand-green)] outline-none bg-white"
              value={selectedAula?.id || ''}
              onChange={(e) => setSelectedAula(aulas.find(a => a.id === parseInt(e.target.value)))}
            >
              {aulas.map(a => (
                <option key={a.id} value={a.id}>{a.titulo}</option>
              ))}
            </select>
          </div>
          
          {selectedAula && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">{selectedAula.titulo}</h2>
              {selectedAula.url && (
                <div className="aspect-video mb-6 bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={selectedAula.url.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              <button
                onClick={markComplete}
                className="bg-[var(--color-brand-green)] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
              >
                <CheckSquare size={20} />
                Marcar como Concluída
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Biblioteca() {
  const [livros, setLivros] = useState<any[]>([]);
  const [lingua, setLingua] = useState('Todas');

  useEffect(() => {
    apiFetch(`/api/biblioteca?lingua=${lingua}`)
      .then(res => res.json())
      .then(setLivros)
      .catch(console.error);
  }, [lingua]);

  const handleDownload = async (id: number, titulo: string) => {
    try {
      const res = await apiFetch(`/api/biblioteca/${id}/download`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titulo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert('Erro ao baixar o PDF.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Biblioteca Islâmica Multilingue</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
        <select
          value={lingua}
          onChange={(e) => setLingua(e.target.value)}
          className="w-full md:w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-brand-green)] outline-none bg-white"
        >
          <option value="Todas">Todas</option>
          <option value="Árabe">Árabe</option>
          <option value="Português">Português</option>
          <option value="Inglês">Inglês</option>
        </select>
      </div>

      <div className="space-y-4">
        {livros.length === 0 ? (
          <p className="text-gray-500">Nenhum livro encontrado para este idioma.</p>
        ) : (
          livros.map(livro => (
            <div key={livro.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span>📙</span> {livro.titulo}
                </h3>
                <p className="text-gray-600 mt-1">Autor: {livro.autor}</p>
                <div className="flex gap-3 mt-2 text-sm text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">Língua: {livro.lingua}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Categoria: {livro.categoria}</span>
                </div>
              </div>
              <button
                onClick={() => handleDownload(livro.id, livro.titulo)}
                className="bg-[var(--color-brand-green)] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors whitespace-nowrap"
              >
                Baixar PDF
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Quizzes() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    apiFetch('/api/quizzes')
      .then(res => res.json())
      .then(setQuizzes)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      alert(data.message);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Avaliação de Conhecimento</h1>
      {quizzes.length === 0 ? (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">Não existem testes ativos.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {quizzes.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="font-bold text-lg mb-4">{idx + 1}. {q.pergunta}</p>
              <div className="space-y-3">
                {[q.op_a, q.op_b, q.op_c].map((op, i) => (
                  <label key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={op}
                      checked={answers[q.id] === op}
                      onChange={() => setAnswers({ ...answers, [q.id]: op })}
                      className="w-4 h-4 text-[var(--color-brand-green)] focus:ring-[var(--color-brand-green)]"
                      required
                    />
                    <span>{op}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="submit"
            className="bg-[var(--color-brand-green)] text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-colors font-medium text-lg"
          >
            Enviar Respostas
          </button>
        </form>
      )}
    </div>
  );
}

function Arabe() {
  const letras = [
    { nome: "Alif", letra: "أ" },
    { nome: "Ba", letra: "ب" },
    { nome: "Ta", letra: "ت" },
    { nome: "Tha", letra: "ث" }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Alfabetização do Alcorão</h1>
      <p className="text-gray-600 mb-8">Estudo das 28 letras e Tajweed.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {letras.map((l, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center aspect-square">
            <div className="text-6xl mb-4 text-[var(--color-brand-green)]">{l.letra}</div>
            <div className="text-xl font-medium text-gray-500">{l.nome}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TutorIA() {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await apiFetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'O Tutor está em oração. Tente daqui a pouco.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Tutor IA Inteligente</h1>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <Bot size={48} className="mx-auto mb-4 opacity-50" />
              <p>Faça uma pergunta sobre o Alcorão ou Fiqh.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[var(--color-brand-green)] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Dúvida sobre o Alcorão ou Fiqh?"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-brand-green)] outline-none bg-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[var(--color-brand-green)] text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 font-medium"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Admin() {
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [lingua, setLingua] = useState('Árabe');
  const [categoria, setCategoria] = useState('Alcorão');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Por favor, selecione um arquivo PDF.');
    
    setLoading(true);
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('autor', autor);
    formData.append('lingua', lingua);
    formData.append('categoria', categoria);
    formData.append('pdf', file);

    try {
      const res = await apiFetch('/api/admin/biblioteca', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        alert('Livro adicionado com sucesso!');
        setTitulo('');
        setAutor('');
        setFile(null);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao adicionar livro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestão da Madrassa</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Adicionar Livro à Biblioteca</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-brand-green)] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
            <input
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-brand-green)] outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Língua</label>
              <select
                value={lingua}
                onChange={(e) => setLingua(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-brand-green)] outline-none bg-white"
              >
                <option value="Árabe">Árabe</option>
                <option value="Português">Português</option>
                <option value="Inglês">Inglês</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-brand-green)] outline-none bg-white"
              >
                <option value="Alcorão">Alcorão</option>
                <option value="Hadith">Hadith</option>
                <option value="Jurisprudência">Jurisprudência</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-brand-green)] outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-brand-green)] text-white py-3 rounded-lg hover:bg-opacity-90 transition-colors font-medium mt-4 disabled:opacity-50"
          >
            {loading ? 'A Salvar...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    return { loggedIn: !!token, user: user || '', role: role || '' };
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!auth.loggedIn) {
    return <Login setAuth={setAuth} />;
  }

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-[var(--color-brand-bg)]">
        <Sidebar auth={auth} setAuth={setAuth} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm z-10 md:hidden flex items-center p-4">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
              <Menu size={24} />
            </button>
            <h1 className="ml-4 text-xl font-bold text-[var(--color-brand-green)]">LITO Academy</h1>
          </header>
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-brand-bg)]">
            <Routes>
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/biblioteca" element={<Biblioteca />} />
              <Route path="/quizzes" element={<Quizzes />} />
              <Route path="/arabe" element={<Arabe />} />
              <Route path="/tutor" element={<TutorIA />} />
              {auth.role === 'admin' && <Route path="/admin" element={<Admin />} />}
              <Route path="*" element={<Navigate to="/cursos" replace />} />
            </Routes>
            <div className="text-center p-6 text-gray-400 text-sm">
              UNFORGETTABLE LITO Academy © 2026
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}
