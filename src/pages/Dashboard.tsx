import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, BookOpen, DollarSign,
  ShoppingBag, Star, Heart, MessageCircle, ArrowUpRight,
  BarChart2, FileText, Layers,
} from 'lucide-react';
import { useBookStore } from '../store/useBookStore';

// ─── Dados mockados ──────────────────────────────────────────────────────────
const SALES_DATA: Record<string, { month: string; vendas: number; receita: number }[]> = {
  semana: [
    { month: 'Seg', vendas: 12, receita: 360 },
    { month: 'Ter', vendas: 19, receita: 570 },
    { month: 'Qua', vendas: 8,  receita: 240 },
    { month: 'Qui', vendas: 25, receita: 750 },
    { month: 'Sex', vendas: 34, receita: 1020 },
    { month: 'Sáb', vendas: 41, receita: 1230 },
    { month: 'Dom', vendas: 22, receita: 660 },
  ],
  mes: [
    { month: 'Jan', vendas: 32, receita: 960 },
    { month: 'Fev', vendas: 45, receita: 1350 },
    { month: 'Mar', vendas: 28, receita: 840 },
    { month: 'Abr', vendas: 60, receita: 1800 },
    { month: 'Mai', vendas: 75, receita: 2250 },
    { month: 'Jun', vendas: 52, receita: 1560 },
    { month: 'Jul', vendas: 88, receita: 2640 },
    { month: 'Ago', vendas: 67, receita: 2010 },
    { month: 'Set', vendas: 93, receita: 2790 },
    { month: 'Out', vendas: 110, receita: 3300 },
    { month: 'Nov', vendas: 98, receita: 2940 },
    { month: 'Dez', vendas: 134, receita: 4020 },
  ],
  ano: [
    { month: '2021', vendas: 320, receita: 9600 },
    { month: '2022', vendas: 580, receita: 17400 },
    { month: '2023', vendas: 740, receita: 22200 },
    { month: '2024', vendas: 910, receita: 27300 },
    { month: '2025', vendas: 489, receita: 14670 },
  ],
};

const FEEDBACK = [
  { name: 'Sofia Rodrigues', time: '2h', book: 'O Labirinto das Estrelas', comment: 'Simplesmente incrível! A construção do universo é impecável.', rating: 5 },
  { name: 'Lucas Mendes', time: '5h', book: 'Receitas da Memória', comment: 'Me fez lembrar da cozinha da minha avó. Perfeito!', rating: 5 },
  { name: 'Carla Nunes', time: '1d', book: 'O Labirinto das Estrelas', comment: 'Personagens muito bem desenvolvidos. Não conseguia parar de ler.', rating: 4 },
];

const PERIOD_LABELS: Record<'semana' | 'mes' | 'ano', string> = {
  semana: 'Últimos 7 dias',
  mes: 'Últimos 12 meses',
  ano: 'Por ano',
};

const MOCK_BOOKS = [
  { title: 'O Guia do Mochileiro', price: 'R$ 34,90', revenue: '+R$ 1.047', color: '#2d1a5c', emoji: '🌌' },
  { title: 'Arte da Persuasão', price: 'R$ 49,90', revenue: '+R$ 2.994', color: '#1a5c2d', emoji: '💡' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-600' },
  review: { label: 'Em Revisão', color: 'bg-amber-100 text-amber-700' },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700' },
};

// ─── Componentes auxiliares ──────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, change, positive, iconBg, iconColor }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <span className={`flex items-center gap-1 text-xs font-semibold ${positive ? 'text-green-600' : 'text-red-500'}`}>
        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change}
      </span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { books } = useBookStore();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'semana' | 'mes' | 'ano'>('mes');
  const [chartMetric, setChartMetric] = useState<'vendas' | 'receita'>('receita');

  const { publishedBooks, inReview, totalWords, totalChapters } = useMemo(() => {
    let tw = 0, tc = 0;
    const pub: typeof books = [], rev: number[] = [];
    for (const b of books) {
      tw += b.chapters.reduce((s, c) => s + c.wordCount, 0);
      tc += b.chapters.length;
      if (b.status === 'published') pub.push(b);
      if (b.status === 'review') rev.push(1);
    }
    return { publishedBooks: pub, inReview: rev.length, totalWords: tw, totalChapters: tc };
  }, [books]);

  const salesData = SALES_DATA[period];
  const totalSales = salesData.reduce((s, d) => s + d.vendas, 0);
  const totalRevenue = salesData.reduce((s, d) => s + d.receita, 0);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">Visão geral da plataforma UmLivro Lab</p>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {([['semana', 'Semana'], ['mes', 'Mês'], ['ano', 'Ano']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPeriod(val)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === val ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Receita total"
            value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`}
            change="+28,4%"
            positive
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            icon={ShoppingBag}
            label="Vendas no período"
            value={totalSales.toLocaleString('pt-BR')}
            change="+12,1%"
            positive
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={Users}
            label="Leitores únicos"
            value="16.146"
            change="-7,4%"
            positive={false}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            icon={BookOpen}
            label="Livros publicados"
            value={String(publishedBooks.length + 12)}
            change="+3 este mês"
            positive
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Gráfico de vendas */}
          <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Visão geral de vendas
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{PERIOD_LABELS[period]}</p>
              </div>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setChartMetric('receita')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${chartMetric === 'receita' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
                >
                  Receita
                </button>
                <button
                  onClick={() => setChartMetric('vendas')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${chartMetric === 'vendas' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
                >
                  Vendas
                </button>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} barSize={period === 'ano' ? 40 : 20}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(v) => {
                      const num = Number(v);
                      return chartMetric === 'receita'
                        ? [`R$ ${num.toLocaleString('pt-BR')}`, 'Receita']
                        : [num, 'Vendas'];
                    }}
                  />
                  <Bar dataKey={chartMetric} fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Meus livros */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                Meus livros
              </h2>
              <button
                onClick={() => navigate('/books')}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
              >
                Ver todos <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="space-y-3 flex-1">
              {books.slice(0, 4).map(book => {
                const st = STATUS_LABELS[book.status];
                return (
                  <div
                    key={book.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 -mx-1.5 transition-colors"
                    onClick={() => navigate(`/editor/${book.id}`)}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: book.coverColor }}
                    >
                      {book.coverEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{book.title}</p>
                      <p className="text-[11px] text-gray-400">{book.chapters.length} cap.</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
              {books.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum livro ainda</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 text-center gap-2">
              <div>
                <p className="text-lg font-bold text-gray-800">{books.length}</p>
                <p className="text-[10px] text-gray-400">Livros</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{inReview}</p>
                <p className="text-[10px] text-gray-400">Em revisão</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{totalWords.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-gray-400">Palavras</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Feedback de leitores */}
          <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                Feedback dos leitores
              </h2>
              <button className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                Ver todos <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="space-y-4">
              {FEEDBACK.map((fb, i) => (
                <div key={i} className={`${i < FEEDBACK.length - 1 ? 'pb-4 border-b border-gray-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {fb.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-800">{fb.name}</p>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">{fb.time} atrás</span>
                      </div>
                      <p className="text-[11px] text-amber-700 mb-1">em "{fb.book}"</p>
                      <p className="text-sm text-gray-600">{fb.comment}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star
                              key={s}
                              size={11}
                              className={s < fb.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                            />
                          ))}
                        </div>
                        <button className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                          <MessageCircle size={11} /> Responder
                        </button>
                        <button className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors">
                          <Heart size={11} /> Curtir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visão geral de publicações */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                Publicações
              </h2>
              <button
                onClick={() => navigate('/books')}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
              >
                Ver todos <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pb-2 border-b border-gray-100 mb-3">
              <span>Livro</span>
              <span>Rendimento</span>
            </div>

            <div className="space-y-3">
              {/* Livros reais publicados */}
              {publishedBooks.slice(0, 2).map(book => (
                <div key={book.id} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: book.coverColor }}
                  >
                    {book.coverEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{book.title}</p>
                    <p className="text-[11px] text-gray-400">{book.author}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-800">
                      {book.metadata?.listPrice
                        ? `R$ ${book.metadata.listPrice.toFixed(2).replace('.', ',')}`
                        : 'R$ —'}
                    </p>
                    <p className="text-[11px] text-green-600 font-medium">Ativo</p>
                  </div>
                </div>
              ))}

              {MOCK_BOOKS.slice(0, Math.max(0, 2 - publishedBooks.length)).map((m, i) => (
                <div key={`mock-${i}`} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: m.color }}
                  >
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{m.title}</p>
                    <p className="text-[11px] text-gray-400">{m.price}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-800">{m.revenue}</p>
                    <p className="text-[11px] text-green-600 font-medium">Ativo</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Solicitações de reembolso</span>
                <span className="font-semibold text-red-500">52 abertas</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Inclui 8 novas solicitações</p>
            </div>
          </div>
        </div>

        {/* Estatísticas de escrita */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Estatísticas de Escrita
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: 'Total de livros', value: books.length, color: 'text-amber-500', bg: 'bg-amber-50' },
              { icon: Layers, label: 'Capítulos escritos', value: totalChapters, color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: BarChart2, label: 'Palavras escritas', value: totalWords.toLocaleString('pt-BR'), color: 'text-green-500', bg: 'bg-green-50' },
              { icon: FileText, label: 'Em revisão', value: inReview, color: 'text-orange-500', bg: 'bg-orange-50' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800 leading-none">{s.value}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

