/* Flaviana Marafoni - interações da landing page
   Sem dependência externa. Tudo degrada com prefers-reduced-motion e sem JS. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* marca que o JS rodou: o CSS usa .js para só animar a abertura do FAQ
     quando esse script está de pé - sem ele o <details> nativo continua
     funcionando normalmente, só que sem a suavização. */
  document.documentElement.classList.add('js');

  /* precisa ser calculado cedo: o "reveal no scroll" usa isto para saber
     quanto tempo esperar antes de acionar a rede de seguranca (ver mais
     abaixo) - enquanto a intro roda ela trava o scroll, entao nenhum
     elemento abaixo do hero pode "entrar na tela" ainda. */
  var JA_VIU_INTRO = 'fm_intro_vista';
  var introJaVista = false;
  try { introJaVista = sessionStorage.getItem(JA_VIU_INTRO) === '1'; } catch (e) { /* modo restrito */ }
  var introVaiRodar = !!document.querySelector('[data-intro]') && !reduced && !introJaVista;

  /* ---------- ano no rodapé ---------- */
  var ano = document.querySelector('[data-ano]');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- tema: claro por padrão, escuro por escolha ----------
     O <head> já carimbou o data-theme antes da primeira pintura; aqui só
     ficam o clique, a persistência e o theme-color da barra do browser. */
  var raiz = document.documentElement;
  var btnTema = document.querySelector('[data-tema]');
  var metaCor = document.querySelector('meta[name="theme-color"]');
  var CHAVE_TEMA = 'fm_tema';
  var COR = { claro: '#fcfcfc', escuro: '#111011' };

  function aplicarTema(escuro) {
    if (escuro) raiz.setAttribute('data-theme', 'dark');
    else raiz.removeAttribute('data-theme');

    if (metaCor) metaCor.setAttribute('content', escuro ? COR.escuro : COR.claro);
    if (btnTema) {
      btnTema.setAttribute('aria-pressed', escuro ? 'true' : 'false');
      btnTema.setAttribute('aria-label', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
    }
  }

  if (btnTema) {
    // só sincroniza o botão com o que o <head> já decidiu - sem gravar nada:
    // localStorage só é escrito quando a pessoa realmente escolhe
    aplicarTema(raiz.getAttribute('data-theme') === 'dark');
    btnTema.addEventListener('click', function () {
      var escuro = raiz.getAttribute('data-theme') !== 'dark';
      aplicarTema(escuro);
      try { localStorage.setItem(CHAVE_TEMA, escuro ? 'escuro' : 'claro'); } catch (e) {}
    });
  }

  /* ---------- relógio da praça ----------
     Fuso fixo de Marataízes: o visitante pode estar em qualquer lugar, mas a
     hora exibida é a de lá. */
  var relogio = document.querySelector('[data-relogio]');
  if (relogio) {
    var tick = function () {
      var agora = new Date();
      var hora;
      try {
        hora = agora.toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo', hour12: false,
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
      } catch (e) {
        hora = agora.toLocaleTimeString('pt-BR', { hour12: false });
      }
      relogio.textContent = hora;
    };
    tick();
    // sem movimento: mostra a hora uma vez e para de piscar
    if (!reduced) window.setInterval(tick, 1000);
  }

  /* ---------- marquee: duplica a lista para o loop ficar contínuo ---------- */
  Array.prototype.forEach.call(
    document.querySelectorAll('[data-marquee] .marquee__track'),
    function (track) {
      if (reduced) { track.style.animation = 'none'; return; }
      track.innerHTML += track.innerHTML;
    }
  );

  /* ---------- reveal no scroll ----------
     Antes o [data-reveal] estava escrito a mao no HTML, so no nivel de
     <section>: a secao inteira aparecia de uma vez, com a mesma curva pra
     um numero em serifa de 40px e uma legenda de 11px. Agora quem revela e
     o ITEM, e o mapa abaixo diz quais itens formam cada grupo.

     Cada linha e [contentor, filhos, variante?, tetoDoIndice?]:
       - variante vira o valor de data-reveal (ver o CSS: mask / rule / draw)
       - tetoDoIndice trava o stagger: com 100+ chips, sem teto o ultimo
         esperaria uns 7 segundos pra aparecer
     Isso mora no JS e nao no HTML de proposito - sem JS nao ha animacao
     nenhuma, entao nao faz sentido sujar a marcacao com atributos inuteis. */
  var GRUPOS = [
    /* --- grupos: definem o indice (--i) e, se houver, a variante --- */
    ['.section__head',      ':children'],
    ['.grid-2',             ':children'],
    ['.stats',              '.stat'],
    ['.datalist',           ':children'],
    ['.audience__card',     '.audience__row'],
    ['.niches',             '.niche'],
    ['.taglist',            'li',          null, 6],
    ['.reelgroup__head',    ':children'],
    ['.cards',              '.card'],
    ['.ticks',              'li'],
    ['.pricelist',          ':children'],
    ['.extras__grid',       ':children'],
    ['.reach',              '.reach__title'],
    ['.reach__grid',        '.reach__item'],
    ['.cases',              '.case'],
    ['.feedbacks',          '.feedbacks__title, .feedbacks__lede'],
    ['.feedbacks__grid',    '.feedback'],
    ['.extras',             'h3'],
    ['.chips',              '.chip',       null, 12],
    ['#faq .container',     'details'],
    ['.cta-final .container', ':children'],

    /* --- refinos: o item ja tem indice, aqui so troca a variante ---
       Vem depois de proposito: se viessem antes, reivindicariam o
       elemento com --i:0 e desalinhariam a cascata do grupo. */
    ['.section__head',      'h2',          'mask'],
    ['.cta-final .container', 'h2',        'mask'],
    ['.stat',               'dd',          'mask'],
    ['.reach__item',        '.reach__num', 'mask'],
    ['.card',               '.card__ico',  'draw'],
    ['.ticks',              '.ico',        'draw']
    /* Os .fan__card ficam FORA: a rolagem do leque ja governa o transform
       deles: um data-reveal ali brigaria pela mesma propriedade. */
  ];

  function marcarGrupos() {
    GRUPOS.forEach(function (g) {
      var contentor = g[0], filhos = g[1], variante = g[2], teto = g[3];
      Array.prototype.forEach.call(document.querySelectorAll(contentor), function (pai) {
        var itens = filhos === ':children'
          ? Array.prototype.slice.call(pai.children)
          : Array.prototype.slice.call(pai.querySelectorAll(filhos));
        itens.forEach(function (el, i) {
          if (!el.hasAttribute('data-reveal')) {
            el.setAttribute('data-reveal', variante || '');
            el.style.setProperty('--i', teto ? Math.min(i, teto) : i);
          } else if (variante && !el.getAttribute('data-reveal')) {
            // ja tem indice de um grupo anterior: so ganha a variante
            el.setAttribute('data-reveal', variante);
          }
        });
      });
    });
  }
  marcarGrupos();

  /* Rede de segurança: se o IntersectionObserver não existir, falhar ou
     simplesmente não disparar, tudo aparece assim mesmo. A página nunca
     pode ficar em branco por causa da animação. */
  var alvos = document.querySelectorAll('[data-reveal]');
  function mostrarTudo() {
    Array.prototype.forEach.call(alvos, function (el) { el.classList.add('is-visible'); });
  }

  if (reduced || !('IntersectionObserver' in window)) {
    mostrarTudo();
  } else {
    try {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
      Array.prototype.forEach.call(alvos, function (el) { obs.observe(el); });
      // se em 2,5s nada tiver sido revelado, o observer não está funcionando -
      // mas com a intro travando o scroll (ate 2,6s) esses 2,5s corriam em
      // paralelo e disparavam essa rede de seguranca cedo demais, revelando
      // a pagina inteira de uma vez antes da pessoa rolar ate la. Por isso a
      // contagem só começa depois que a intro libera o scroll.
      window.setTimeout(function () {
        if (!document.querySelector('[data-reveal].is-visible')) mostrarTudo();
      }, introVaiRodar ? 2500 + 2600 : 2500);
    } catch (e) {
      mostrarTudo();
    }
  }

  /* ---------- seção ativa na nav ----------
     Marca o link da seção que está sendo lida. Puro enfeite de orientação:
     sem ele os links continuam funcionando exatamente igual. */
  var linksNav = Array.prototype.slice.call(
    document.querySelectorAll('.nav nav a[href^="#"]')
  );
  if (linksNav.length && 'IntersectionObserver' in window) {
    try {
      var secoes = linksNav.map(function (a) {
        return document.querySelector(a.getAttribute('href'));
      });
      var visiveis = [];

      var espiao = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var i = secoes.indexOf(e.target);
          if (i < 0) return;
          var pos = visiveis.indexOf(i);
          if (e.isIntersecting && pos < 0) visiveis.push(i);
          else if (!e.isIntersecting && pos > -1) visiveis.splice(pos, 1);
        });
        // com duas seções na tela, vale a de cima
        var ativa = visiveis.length ? Math.min.apply(null, visiveis) : -1;
        linksNav.forEach(function (a, i) {
          if (i === ativa) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      }, { rootMargin: '-40% 0px -50% 0px' });

      secoes.forEach(function (s) { if (s) espiao.observe(s); });
    } catch (e) { /* sem destaque de seção - os links seguem normais */ }
  }

  /* ---------- SUMÁRIO: régua de margem + folha do mobile ----------
     A régua é um mapa 1:1 da página: a altura de cada segmento é a altura real
     da seção. Isso o CSS não tem como saber sozinho, então quem mede é aqui.

     A conta é feita em PROGRESSO DE ROLAGEM, não em pixels do documento, de
     propósito: a tinta que desce a régua é a animation-timeline: scroll(), que
     anda de 0 a 1 conforme scrollTop / (scrollHeight - clientHeight). Medindo
     na mesma régua, a ponta da tinta cai exatamente em cima do traço da seção
     que está sendo lida - qualquer outra base faria as duas se descolarem no
     fim da página.

     O desconto de 35% da tela dentro do y é o que faz uma seção "virar atual"
     quando o topo dela sobe até o primeiro terço, e não quando encosta na
     borda de baixo. É o mesmo critério do rootMargin do espião ali de cima.

     Sem JS nada disto roda: a lista continua no fallback de espaçamento
     regular do CSS e o botão da folha nunca sai do [hidden]. */
  (function () {
    var regua = document.querySelector('[data-rail]');
    if (!regua) return;

    var itens = Array.prototype.slice.call(regua.querySelectorAll('.rail__item'));
    var marcas = itens.map(function (li) {
      var a = li.querySelector('.rail__link');
      var href = a ? a.getAttribute('href') : '';
      return {
        li: li,
        a: a,
        alvo: href && href.length > 1 ? document.getElementById(href.slice(1)) : null,
        secao: li.getAttribute('data-nivel') === '1',
        y: 0
      };
    }).filter(function (m) {
      // marca cujo destino sumiu da pagina nao vira um traço orfao empilhado
      // no topo da regua: some junto
      if (m.a && m.alvo) return true;
      m.li.hidden = true;
      return false;
    });

    if (!marcas.length) return;

    /* ---- medida ---- */
    function faixa() {
      return Math.max(1, raiz.scrollHeight - raiz.clientHeight);
    }

    function medir() {
      var total = faixa();
      var recuo = raiz.clientHeight * 0.35;
      var anterior = 0;
      marcas.forEach(function (m) {
        /* No mobile, "Stories em destaque" e "Combos" podem estar dentro de uma
           aba fechada: sem caixa, o getBoundingClientRect volta zerado e o
           ponto iria parar no topo da régua, embaralhando a ordem. Herdar a
           posição do ponto anterior mantém a sequência crescente - e a marca
           acende junto com a seção que a contém, que é a leitura certa. */
        if (!m.alvo.getClientRects().length) {
          m.y = anterior;
        } else {
          var topo = m.alvo.getBoundingClientRect().top + window.pageYOffset;
          m.y = Math.min(1, Math.max(0, (topo - recuo) / total));
        }
        anterior = m.y;
        m.li.style.setProperty('--y', m.y);
        if (m.secao) {
          m.li.style.setProperty('--h', Math.min(1, m.alvo.offsetHeight / total));
        }
      });
      regua.setAttribute('data-medida', '');
    }

    /* ---- seção/ponto sendo lido ---- */
    var atual = -1;
    function pintar() {
      var p = window.pageYOffset / faixa();
      // a marca atual é a última que a tinta já passou
      var i = 0;
      for (var k = 0; k < marcas.length; k++) { if (marcas[k].y <= p + 0.001) i = k; }
      if (i === atual) return;
      atual = i;
      marcas.forEach(function (m, k) {
        // acende o ponto e, junto com ele, a seção que o contém
        var aceso = k === i || (m.secao && k === secaoDe(i));
        if (aceso) m.a.setAttribute('aria-current', 'true');
        else m.a.removeAttribute('aria-current');
      });
      if (clonesLista) sincronizarFolha(i);
    }
    function secaoDe(i) {
      for (var k = i; k >= 0; k--) { if (marcas[k].secao) return k; }
      return -1;
    }

    var agendado = false;
    function agendar() {
      if (agendado) return;
      agendado = true;
      window.requestAnimationFrame(function () { agendado = false; pintar(); });
    }

    function remedir() { medir(); atual = -1; pintar(); }

    // as abas do mobile escondem e mostram blocos inteiros: a página muda de
    // altura sem que ninguém role nem redimensione nada
    window.addEventListener('fm:remedir', remedir);

    medir();
    pintar();
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', remedir, { passive: true });
    // as fontes e as capas do YouTube chegam depois e mexem na altura da página
    window.addEventListener('load', remedir);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remedir);
    // o FAQ abre e fecha respostas: a página cresce e encolhe em uso
    Array.prototype.forEach.call(document.querySelectorAll('#faq details'), function (d) {
      d.addEventListener('toggle', function () { window.setTimeout(remedir, 420); });
    });

    /* ---- folha do mobile: a MESMA lista, clonada daqui ---- */
    var folha = document.querySelector('[data-sumario]');
    var abrir = document.querySelector('[data-sumario-abrir]');
    var corpo = folha && folha.querySelector('[data-sumario-corpo]');
    var clonesLista = null;
    var clones = [];
    var voltarFocoFolha = null;

    function sincronizarFolha(i) {
      clones.forEach(function (a, k) {
        if (k === i || (marcas[k].secao && k === secaoDe(i))) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    if (folha && abrir && corpo) {
      var lista = document.createElement('ol');
      lista.className = 'folha__lista';
      marcas.forEach(function (m) {
        var li = document.createElement('li');
        li.setAttribute('data-nivel', m.secao ? '1' : '2');
        var a = document.createElement('a');
        a.href = m.a.getAttribute('href');
        // innerHTML aqui é conteúdo do próprio HTML da régua, não entrada de
        // usuário: preserva o <b> do número sem precisar remontar à mão
        a.innerHTML = m.a.querySelector('.rail__rotulo').innerHTML;
        li.appendChild(a);
        lista.appendChild(li);
        clones.push(a);
      });
      corpo.appendChild(lista);
      clonesLista = lista;
      abrir.hidden = false;
      atual = -1;
      pintar();

      var fecharFolha = function () {
        if (folha.hidden) return;
        folha.hidden = true;
        abrir.setAttribute('aria-expanded', 'false');
        raiz.style.overflow = '';
        if (voltarFocoFolha && voltarFocoFolha.focus) voltarFocoFolha.focus();
      };

      abrir.addEventListener('click', function () {
        voltarFocoFolha = document.activeElement;
        folha.hidden = false;
        abrir.setAttribute('aria-expanded', 'true');
        raiz.style.overflow = 'hidden';
        var primeiro = folha.querySelector('.folha__fechar');
        if (primeiro) primeiro.focus();
      });

      Array.prototype.forEach.call(folha.querySelectorAll('[data-sumario-fechar]'), function (b) {
        b.addEventListener('click', fecharFolha);
      });
      // clicou num item: fecha e deixa a âncora nativa levar
      lista.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('a')) fecharFolha();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') fecharFolha();
      });
      // voltou pro desktop com a folha aberta: a régua reassume
      window.addEventListener('resize', function () {
        if (window.innerWidth >= 1100) fecharFolha();
      }, { passive: true });
    }
  }());

  /* ---------- intro 3D: roda uma vez por sessão ---------- */
  var intro = document.querySelector('[data-intro]');
  var JA_VIU = JA_VIU_INTRO;
  var visto = introJaVista;

  function entrar() {
    body.classList.add('is-entered');
  }

  // rede de seguranca: o hero nunca pode ficar escondido esperando a intro
  window.setTimeout(entrar, 4000);

  function encerrarIntro() {
    if (!intro || intro.classList.contains('is-done')) return;
    intro.classList.add('is-done');
    body.classList.remove('is-intro');
    entrar();
    try { sessionStorage.setItem(JA_VIU, '1'); } catch (e) {}
    window.setTimeout(function () { intro.hidden = true; }, 950);
  }

  if (!intro || reduced || visto) {
    if (intro) intro.hidden = true;
    entrar();
  } else {
    body.classList.add('is-intro');
    // dispara no próximo frame para a animação começar do estado inicial
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { intro.classList.add('is-playing'); });
    });
    window.setTimeout(encerrarIntro, 2600);

    intro.addEventListener('click', encerrarIntro);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') encerrarIntro();
    });
  }

  /* ---------- parallax do objeto 3D ---------- */
  var objs = document.querySelectorAll('[data-parallax]');
  var fino = window.matchMedia('(pointer: fine)').matches;
  if (objs.length && fino && !reduced) {
    var pendente = false, mx = 0, my = 0;

    window.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth) * 2 - 1;   // -1 .. 1
      my = (e.clientY / window.innerHeight) * 2 - 1;
      if (pendente) return;
      pendente = true;
      window.requestAnimationFrame(function () {
        pendente = false;
        Array.prototype.forEach.call(objs, function (o) {
          o.style.setProperty('--tx', (mx * 14).toFixed(2) + 'deg');
          o.style.setProperty('--ty', (-my * 10).toFixed(2) + 'deg');
        });
      });
    }, { passive: true });
  }

  /* ---------- leque de reels ----------
     O CSS ja sabe desenhar o leque; aqui so entra a conta da rolagem.
     Para cada "mao" de cartas escrevemos --k (-1 chegando, 0 alinhada,
     +1 saindo) e --ka (o mesmo em modulo). Duas propriedades por mao por
     quadro - nada de mexer carta por carta.

     O efeito e opt-in: sem tela larga, sem JS ou com movimento reduzido a
     secao continua sendo a grade que ja esta no HTML. */
  var telaLarga = window.matchMedia('(min-width: 900px)');

  /* Faixa de descanso do leque.
     Sem ela, --k = 0 (fileira reta, alinhada e centralizada) era um ponto sem
     largura: a rolagem atravessava o instante certo e a pessoa so via cartas
     tortas, em qualquer altura que parasse. DESCANSO e a fatia da rolagem, em
     volta do centro de cada mao, em que a fileira fica parada e reta; fora
     dela o curso restante e reesticado de 0 a 1, entao o leque abre e cruza
     com a mao seguinte exatamente como antes. */
  var DESCANSO = 0.42;

  function repousar(k) {
    var sinal = k < 0 ? -1 : 1, a = k < 0 ? -k : k;
    if (a <= DESCANSO) return 0;
    var t = (a - DESCANSO) / (1 - DESCANSO);
    // suaviza a saida do repouso (derivada zero na borda: nao "estala");
    // passado o fim do curso segue reto, so pra empurrar a carta pra fora
    if (t < 1) t = t * t * (3 - 2 * t);
    return sinal * t;
  }

  function iniciarLeque(leque) {
    var maos = Array.prototype.slice.call(leque.querySelectorAll('[data-fan-hand]'));
    var pontos = Array.prototype.slice.call(leque.querySelectorAll('[data-fan-go]'));
    var contador = leque.querySelector('[data-fan-atual]');
    var ligado = false, naFila = false, maoAtual = -1;

    // altura de rolagem util: o trecho em que o palco fica grudado no topo
    function trilho() { return leque.offsetHeight - window.innerHeight; }

    function limpar() {
      maos.forEach(function (m) {
        m.style.removeProperty('--k');
        m.style.removeProperty('--ka');
        m.style.zIndex = '';
        m.classList.remove('is-live');
      });
    }

    function pintar() {
      naFila = false;
      if (!ligado) return;
      var curso = trilho();
      if (curso <= 0) return;

      var p = -leque.getBoundingClientRect().top / curso;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);

      var n = maos.length;
      maos.forEach(function (m, i) {
        // cada mao domina uma fatia da rolagem e a atravessa de -1 a +1,
        // parando reta no meio do caminho (ver DESCANSO)
        var k = repousar((p * n - i - 0.5) * 2);
        if (k < -1.6) k = -1.6; else if (k > 1.6) k = 1.6;
        var ka = k < 0 ? -k : k;
        m.style.setProperty('--k', k.toFixed(3));
        m.style.setProperty('--ka', ka.toFixed(3));
        // a mao mais proxima do centro fica por cima das outras
        m.style.zIndex = String(60 - Math.round(ka * 20));
        m.classList.toggle('is-live', ka < 0.5);
      });

      var atual = Math.floor(p * n);
      if (atual > n - 1) atual = n - 1;
      if (atual !== maoAtual) {
        maoAtual = atual;
        pontos.forEach(function (b, i) {
          b.classList.toggle('is-on', i === atual);
          if (i === atual) b.setAttribute('aria-current', 'true');
          else b.removeAttribute('aria-current');
        });
        if (contador) contador.textContent = ('0' + (atual + 1)).slice(-2);
      }
    }

    function agendar() {
      if (naFila || !ligado) return;
      naFila = true;
      window.requestAnimationFrame(pintar);
    }

    function irPara(i) {
      var topo = leque.getBoundingClientRect().top + window.pageYOffset;
      var alvo = topo + trilho() * ((i + 0.5) / maos.length);
      try {
        window.scrollTo({ top: alvo, behavior: reduced ? 'auto' : 'smooth' });
      } catch (e) {
        window.scrollTo(0, alvo);   // navegador antigo: sem opcoes
      }
    }

    function conferir() {
      ligado = telaLarga.matches && !reduced;
      leque.classList.toggle('is-on', ligado);
      if (ligado) { maoAtual = -1; pintar(); } else limpar();
    }

    pontos.forEach(function (b) {
      b.addEventListener('click', function () { irPara(Number(b.getAttribute('data-fan-go'))); });
    });

    // teclado: ao tabular para uma carta que esta fora do centro, leva a
    // rolagem ate ela - senao o foco sumiria numa carta transparente
    leque.addEventListener('focusin', function (e) {
      if (!ligado || !e.target.closest) return;
      var mao = e.target.closest('[data-fan-hand]');
      if (!mao || mao.classList.contains('is-live')) return;
      irPara(maos.indexOf(mao));
    });

    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', function () { maoAtual = -1; agendar(); }, { passive: true });
    if (telaLarga.addEventListener) telaLarga.addEventListener('change', conferir);
    else if (telaLarga.addListener) telaLarga.addListener(conferir);
    conferir();
  }

  var leques = Array.prototype.slice.call(document.querySelectorAll('[data-fan]'));
  leques.forEach(iniciarLeque);

  if (leques.length) {
    /* ---- capa em alta: o hqdefault sempre existe, o resto nem sempre ----
       Tenta a versao vertical do Short e, se nao houver, a 1280x720. Se as
       duas falharem fica o hqdefault que ja veio no HTML. */
    Array.prototype.forEach.call(document.querySelectorAll('[data-fan] [data-yt] img'), function (img) {
      var id = img.closest('[data-yt]').getAttribute('data-yt');
      var opcoes = ['oardefault', 'maxresdefault'];
      (function tentar(i) {
        if (i >= opcoes.length) return;
        var teste = new Image();
        teste.onload = function () {
          // o placeholder cinza do YouTube vem 120x90: nao serve
          if (teste.naturalWidth > 320) img.src = teste.src;
          else tentar(i + 1);
        };
        teste.onerror = function () { tentar(i + 1); };
        teste.src = 'https://i.ytimg.com/vi/' + id + '/' + opcoes[i] + '.jpg';
      })(0);
    });
  }

  /* ---------- caixa de video: o player so nasce no clique ---------- */
  var gatilhos = document.querySelectorAll('[data-yt]');
  if (gatilhos.length) {
    // PENDENTE: os dois botoes de Instagram da caixa apontam pro perfil
    // porque ainda nao ha o link do post/reel equivalente de cada video.
    var IG_PERFIL = 'https://instagram.com/flavianamarafoni';
    var caixa = null, fechar = null, moldura = null, voltarFoco = null;

    function montarCaixa() {
      caixa = document.createElement('div');
      caixa.className = 'lb';
      caixa.hidden = true;
      caixa.innerHTML =
        '<button class="lb__scrim" type="button" aria-label="Fechar vídeo"></button>' +
        '<div class="lb__stack">' +
          '<div class="lb__toprow">' +
            '<a class="lb__ig lb__ig--top" href="' + IG_PERFIL + '" target="_blank" rel="noopener">' +
              '<svg class="ico" aria-hidden="true"><use href="#i-instagram"/></svg>Ver vídeo no Instagram' +
            '</a>' +
            '<button class="lb__close" type="button">' +
              '<svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg>Fechar' +
            '</button>' +
          '</div>' +
          '<div class="lb__box" role="dialog" aria-modal="true" aria-label="Reels no YouTube"></div>' +
          '<a class="lb__ig lb__ig--bottom" href="' + IG_PERFIL + '" target="_blank" rel="noopener">' +
            '<svg class="ico" aria-hidden="true"><use href="#i-instagram"/></svg>Acessar meu Instagram' +
          '</a>' +
        '</div>';
      document.body.appendChild(caixa);
      moldura = caixa.querySelector('.lb__box');
      fechar = caixa.querySelector('.lb__close');
      caixa.querySelector('.lb__scrim').addEventListener('click', fecharVideo);
      fechar.addEventListener('click', fecharVideo);
    }

    function abrirVideo(id) {
      if (!caixa) montarCaixa();
      voltarFoco = document.activeElement;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube.com/embed/' + id +
              '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
      f.title = 'Reels no YouTube';
      f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
      f.setAttribute('allowfullscreen', '');
      moldura.appendChild(f);
      caixa.hidden = false;
      raiz.style.overflow = 'hidden';
      fechar.focus();
    }

    function fecharVideo() {
      if (!caixa || caixa.hidden) return;
      caixa.hidden = true;
      var f = moldura.querySelector('iframe');
      if (f) f.parentNode.removeChild(f);   // remover mata o som na hora
      raiz.style.overflow = '';
      if (voltarFoco && voltarFoco.focus) voltarFoco.focus();
    }

    Array.prototype.forEach.call(gatilhos, function (a) {
      a.addEventListener('click', function (e) {
        // ctrl/cmd/meio: deixa o navegador abrir em aba nova, como sempre
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        abrirVideo(a.getAttribute('data-yt'));
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fecharVideo();
    });
  }

  /* ---------- FAQ: abertura suave da resposta ----------
     <details> nativo troca aberto/fechado sem transição. Aqui a gente
     intercepta o clique, mede a altura real da resposta e anima
     height/opacity; o atributo [open] só é tocado no fim de cada
     animação para o <details> continuar acessível (teclado, sem JS). */
  (function () {
    var itens = document.querySelectorAll('#faq details');
    if (!itens.length || reduced) return;

    itens.forEach(function (item) {
      var resumo = item.querySelector('summary');
      var resposta = item.querySelector('p');
      if (!resumo || !resposta) return;
      var animando = false;

      resumo.addEventListener('click', function (ev) {
        if (animando) { ev.preventDefault(); return; }
        ev.preventDefault();
        animando = true;

        var fechando = item.hasAttribute('open');

        if (fechando) {
          // parte da altura atual e anima até 0
          resposta.style.height = resposta.scrollHeight + 'px';
        } else {
          item.setAttribute('open', '');
          resposta.style.height = '0px';
          resposta.style.opacity = '0';
        }

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (fechando) {
              resposta.style.height = '0px';
              resposta.style.opacity = '0';
            } else {
              resposta.style.height = resposta.scrollHeight + 'px';
              resposta.style.opacity = '1';
            }
          });
        });

        resposta.addEventListener('transitionend', function fim(e) {
          if (e.propertyName !== 'height') return;
          resposta.removeEventListener('transitionend', fim);
          if (fechando) {
            item.removeAttribute('open');
            resposta.style.height = '';
          } else {
            // "auto" para acompanhar mudanças de conteúdo/tamanho de tela
            // sem precisar recalcular - height fixo em px travaria isso.
            resposta.style.height = 'auto';
          }
          animando = false;
        });
      });
    });
  }());

  /* =========================================================
     MOBILE: HORIZONTALIZAÇÃO
     ---------------------------------------------------------
     Duas peças, e as duas são OPT-IN por largura de tela. O CSS já faz o
     trabalho pesado do trilho (scroll-snap puro); daqui sai só o que CSS não
     tem como saber: em que cartão a pessoa está.

     Nada aqui remove conteúdo do DOM. Sem este script a página continua
     exatamente como está hoje no celular - empilhada, mas inteira.
     ========================================================= */
  var ESTREITO = window.matchMedia('(max-width: 860px)');

  function ouvirLargura(fn) {
    if (ESTREITO.addEventListener) ESTREITO.addEventListener('change', fn);
    else if (ESTREITO.addListener) ESTREITO.addListener(fn);
  }

  /* ---------- 1. TRILHO: a bússola da fileira deitada ----------
     Mesmo vocabulário do leque do desktop (.fan__nav): contador em mono e
     traços de 1px que acendem em mauve. O scroll em si é do navegador - a
     gente só lê a posição e devolve o traço aceso. */
  function iniciarTrilho(trilho) {
    var itens = Array.prototype.filter.call(trilho.children, function (el) {
      return el.nodeType === 1;
    });
    if (itens.length < 2) return;

    var rotulo = trilho.getAttribute('data-trilho-rotulo') || '';

    var nav = document.createElement('nav');
    nav.className = 'trilho__nav';
    nav.setAttribute('aria-label', rotulo ? 'Navegar em ' + rotulo : 'Navegar nos cartões');

    /* A instrução do gesto vem ANTES do controle, na ordem em que a pessoa
       precisa: primeiro o que fazer, depois onde. aria-hidden porque para o
       leitor de tela isto seria ruído - ele já anuncia os botões da bússola
       com o rótulo completo ("Ir para o item 2 de 4"). */
    var dica = document.createElement('span');
    dica.className = 'trilho__dica';
    dica.setAttribute('aria-hidden', 'true');
    dica.innerHTML = '<svg class="ico"><use href="#i-arrastar"/></svg>Arraste ou toque';
    nav.appendChild(dica);

    var bussola = document.createElement('div');
    bussola.className = 'trilho__bussola';
    nav.appendChild(bussola);

    var contador = document.createElement('p');
    contador.className = 'trilho__count';
    contador.innerHTML = '<b>01</b> / ' + ('0' + itens.length).slice(-2);
    bussola.appendChild(contador);

    var pontos = itens.map(function (el, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'trilho__dot';
      b.setAttribute('aria-label', 'Ir para o item ' + (i + 1) + ' de ' + itens.length);
      b.addEventListener('click', function () { irPara(i); });
      bussola.appendChild(b);
      return b;
    });

    /* A bússola mora logo ao lado do trilho. Exceção: no leque de Reels o
       trilho é a "mão" de cartas, que vive dois níveis abaixo (.fan >
       .fan__stage > .fan__deck). Pendurar a bússola lá dentro dava dois
       problemas de uma vez: ela ficava presa no palco do leque E tirava do
       .fan__hand o :only-child de que o rótulo "Grupo N" depende para sumir -
       o rótulo voltava e, com o trilho deitado, virava a primeira fatia da
       fileira. Aqui ela sobe para depois do .fan inteiro. */
    var ancora = (trilho.closest && trilho.closest('.fan')) || trilho;
    ancora.parentNode.insertBefore(nav, ancora.nextSibling);

    function recuo() {
      return parseFloat(window.getComputedStyle(trilho).paddingLeft) || 0;
    }

    /* o item ativo é aquele cuja borda esquerda está mais perto da linha de
       encaixe do trilho - a mesma que o scroll-snap usa.

       O fim do curso é caso à parte: o último cartão nunca chega a encostar
       na linha de encaixe (não há trilho depois dele para empurrá-lo até lá),
       então sem esta saída o contador travaria no penúltimo. */
    function indice() {
      var fim = trilho.scrollWidth - trilho.clientWidth;
      if (fim > 0 && trilho.scrollLeft >= fim - 2) return itens.length - 1;
      var linha = trilho.getBoundingClientRect().left + recuo();
      var melhor = 0, menor = Infinity;
      itens.forEach(function (el, i) {
        var d = Math.abs(el.getBoundingClientRect().left - linha);
        if (d < menor - 1) { menor = d; melhor = i; }
      });
      return melhor;
    }

    function irPara(i) {
      var linha = trilho.getBoundingClientRect().left + recuo();
      var delta = itens[i].getBoundingClientRect().left - linha;
      try {
        trilho.scrollBy({ left: delta, behavior: reduced ? 'auto' : 'smooth' });
      } catch (e) {
        trilho.scrollLeft += delta;   // navegador antigo: sem opções
      }
    }

    var visto = -1, naFila = false;
    function pintar() {
      naFila = false;
      var i = indice();
      if (i === visto) return;
      visto = i;
      contador.innerHTML = '<b>' + ('0' + (i + 1)).slice(-2) + '</b> / ' +
        ('0' + itens.length).slice(-2);
      pontos.forEach(function (b, k) {
        b.classList.toggle('is-on', k === i);
        if (k === i) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
    }
    function agendar() {
      if (naFila) return;
      naFila = true;
      window.requestAnimationFrame(pintar);
    }

    trilho.addEventListener('scroll', agendar, { passive: true });
    // girar o aparelho recalcula a fatia (ela é %) e desloca o encaixe sem
    // que ninguém tenha rolado nada
    window.addEventListener('resize', function () { visto = -1; agendar(); }, { passive: true });

    /* Região rolável precisa ser alcançável pelo teclado - mas só onde ela
       realmente rola. No desktop isto é uma grade comum: um tabindex ali
       seria uma parada de tabulação que não leva a lugar nenhum. */
    function conferir() {
      if (ESTREITO.matches) {
        trilho.setAttribute('tabindex', '0');
        trilho.setAttribute('role', 'group');
        if (rotulo) trilho.setAttribute('aria-label', rotulo);
        visto = -1;
        agendar();
      } else {
        trilho.removeAttribute('tabindex');
        trilho.removeAttribute('role');
        trilho.removeAttribute('aria-label');
      }
    }
    ouvirLargura(conferir);
    conferir();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-trilho]'), iniciarTrilho);

  /* ---------- 2. ABAS: um painel por vez ----------
     Onde o trilho não resolve. Conteúdo tem cinco grupos de cartas; a tabela
     de Investimento tem três cartas altas demais para deitar (a mais alta
     ditaria a altura das outras duas). Aqui o bloco inteiro alterna.

     É a única peça da página que ESCONDE algo - e por isso ela só esconde
     quando o script está de pé E a tela é estreita. Em qualquer outro caso
     todos os painéis voltam visíveis, na ordem original. */
  var ABAS = [];

  function iniciarAbas(paineis, rotulo, dica) {
    if (paineis.length < 2) return;

    var linha = document.createElement('p');
    linha.className = 'abas__dica';
    linha.setAttribute('aria-hidden', 'true');
    linha.innerHTML = '<svg class="ico"><use href="#i-toque"/></svg>' + dica;

    var barra = document.createElement('div');
    barra.className = 'abas';
    barra.setAttribute('role', 'tablist');
    barra.setAttribute('aria-label', rotulo);

    var atual = 0;

    // prefixo estável por bloco, para os ids de tab/tabpanel não colidirem
    // entre o seletor de Conteúdo e o de Investimento
    var marca = 'aba-' + (ABAS.length + 1);

    var botoes = paineis.map(function (painel, i) {
      if (!painel.id) painel.id = marca + '-painel-' + i;

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'abas__aba';
      b.id = marca + '-' + i;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', painel.id);
      b.textContent = painel.getAttribute('data-aba') || String(i + 1);
      b.addEventListener('click', function () { mostrar(i, true); });
      barra.appendChild(b);
      return b;
    });

    paineis[0].parentNode.insertBefore(linha, paineis[0]);
    paineis[0].parentNode.insertBefore(barra, paineis[0]);

    function mostrar(i, avisar) {
      atual = i;
      var estreito = ESTREITO.matches;
      paineis.forEach(function (p, k) {
        p.hidden = estreito && k !== i;
        /* Os papéis de tabpanel só valem enquanto existe uma tablist: no
           desktop a barra é display:none (sai da árvore de acessibilidade) e
           um tabpanel órfão só confundiria o leitor de tela. */
        if (estreito) {
          p.setAttribute('role', 'tabpanel');
          p.setAttribute('aria-labelledby', botoes[k].id);
        } else {
          p.removeAttribute('role');
          p.removeAttribute('aria-labelledby');
        }
      });
      botoes.forEach(function (b, k) {
        b.setAttribute('aria-selected', k === i ? 'true' : 'false');
        b.setAttribute('tabindex', k === i ? '0' : '-1');
      });
      // a página encolheu ou cresceu: a régua do sumário mede altura real
      if (avisar) window.dispatchEvent(new CustomEvent('fm:remedir'));
    }

    /* setas do teclado percorrem as abas, como manda o padrão de tablist */
    barra.addEventListener('keydown', function (e) {
      var passo = e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowLeft' ? -1 : 0);
      if (!passo) return;
      e.preventDefault();
      var i = (atual + passo + paineis.length) % paineis.length;
      mostrar(i, true);
      botoes[i].focus();
    });

    function conferir() { mostrar(atual, false); }
    ouvirLargura(conferir);
    conferir();

    ABAS.push({ paineis: paineis, mostrar: mostrar });
  }

  function paineisDe(contentor) {
    return contentor
      ? Array.prototype.filter.call(contentor.children, function (el) {
          return el.nodeType === 1 && el.hasAttribute('data-aba');
        })
      : [];
  }

  iniciarAbas(
    Array.prototype.slice.call(document.querySelectorAll('#conteudos [data-aba]')),
    'Tipos de conteúdo',
    'Toque para trocar de tipo de conteúdo'
  );
  iniciarAbas(
    paineisDe(document.querySelector('#investimento .cards')),
    'Formatos e preços',
    'Toque para ver cada formato e preço'
  );

  /* Uma âncora pode apontar para dentro de um painel fechado - o sumário tem
     link para "Combos", "Stories em destaque" e companhia. Em vez de proibir
     esses links no mobile, o clique ABRE a aba certa antes de o navegador
     rolar. Vale para a régua, para a folha e para qualquer link da página. */
  function abrirAbaDe(alvo) {
    if (!alvo || !alvo.closest) return false;
    var painel = alvo.closest('[data-aba]');
    if (!painel || !painel.hidden) return false;
    for (var i = 0; i < ABAS.length; i++) {
      var k = ABAS[i].paineis.indexOf(painel);
      if (k > -1) { ABAS[i].mostrar(k, true); return true; }
    }
    return false;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    abrirAbaDe(document.getElementById(id));
  }, true);

  // chegou na página já com o hash na URL
  if (location.hash.length > 1) {
    try {
      if (abrirAbaDe(document.getElementById(location.hash.slice(1)))) {
        window.requestAnimationFrame(function () {
          var alvo = document.getElementById(location.hash.slice(1));
          if (alvo && alvo.scrollIntoView) alvo.scrollIntoView();
        });
      }
    } catch (e) { /* hash inválido: segue a vida */ }
  }

  /* ---------- 3. DÚVIDAS: filtro por assunto ----------
     Doze perguntas fechadas somavam mais de uma tela só de cabeçalho. Aqui
     nem trilho nem aba servem:
       - trilho: a resposta é para LER, não para deslizar de relance;
       - aba: exigiria reagrupar o HTML, e a ordem das perguntas é
         deliberada (as primeiras são exatamente o que a marca digita no
         Google - ver o comentário no index.html).

     Então a peça é um FILTRO: as etiquetas escondem e mostram, mas ninguém
     sai do lugar. A ordem original continua de pé, o FAQPage do JSON-LD
     continua batendo com a página e "Todas" traz as doze de volta num toque. */
  (function () {
    var duvidas = Array.prototype.slice.call(
      document.querySelectorAll('#faq details[data-duvida]')
    );
    if (duvidas.length < 4) return;

    /* "Todas" vem PRIMEIRO de propósito: a fileira de etiquetas passa de 335px
       num aparelho estreito e rola de lado, então a última ficaria fora da
       vista - e justamente a saída de emergência do filtro não pode ser a que
       some. Na frente, ela está sempre visível; a ativa (Preços) fica logo ao
       lado dela. */
    var ASSUNTOS = [
      ['*', 'Todas'],
      ['precos', 'Preços'],
      ['atendimento', 'Como funciona'],
      ['perfil', 'Perfil']
    ];
    var atual = 'precos';

    var linha = document.createElement('p');
    linha.className = 'abas__dica';
    linha.setAttribute('aria-hidden', 'true');
    linha.innerHTML = '<svg class="ico"><use href="#i-toque"/></svg>' +
      'Toque no assunto para filtrar as perguntas';

    var barra = document.createElement('div');
    barra.className = 'abas';
    barra.setAttribute('role', 'group');
    barra.setAttribute('aria-label', 'Filtrar dúvidas por assunto');

    var botoes = ASSUNTOS.map(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'abas__aba';
      b.textContent = a[1];
      b.addEventListener('click', function () { aplicar(a[0], true); });
      barra.appendChild(b);
      return b;
    });

    duvidas[0].parentNode.insertBefore(linha, duvidas[0]);
    duvidas[0].parentNode.insertBefore(barra, duvidas[0]);

    function aplicar(assunto, avisar) {
      atual = assunto;
      var estreito = ESTREITO.matches;
      var primeira = null;

      duvidas.forEach(function (d) {
        var fora = estreito && assunto !== '*' && d.getAttribute('data-duvida') !== assunto;
        d.hidden = fora;
        if (!fora && !primeira) primeira = d;
      });

      /* o filete de cima da lista mora no :first-of-type, que é posição no
         DOM - com metade das perguntas escondidas, a primeira VISÍVEL ficava
         sem a linha que abre o bloco */
      duvidas.forEach(function (d) { d.classList.toggle('e-primeira', d === primeira); });

      botoes.forEach(function (b, k) {
        b.setAttribute('aria-pressed', ASSUNTOS[k][0] === assunto ? 'true' : 'false');
      });

      if (avisar) window.dispatchEvent(new CustomEvent('fm:remedir'));
    }

    function conferir() { aplicar(atual, false); }
    ouvirLargura(conferir);
    conferir();
  }());

  /* ---------- 4. AS INSTRUÇÕES CHEGAM E SAEM ----------
     Diferente do [data-reveal] do resto da página, este observador NÃO dá
     unobserve: a frase precisa reacender toda vez que aquele ponto volta à
     vista. É justamente a chegada dela que faz o olho ir até ali - uma
     instrução parada some dentro do cenário depois da terceira seção.

     A classe é retirada quando o ponto sai da tela, e a animação só pode
     recomeçar do zero depois disso; por isso o rootMargin é generoso nas duas
     pontas, para o ciclo fechar bem longe de onde ele começou e a frase não
     ficar piscando com um tremido de rolagem. */
  var dicas = document.querySelectorAll('.trilho__dica,.abas__dica,.chips__dica');

  /* Rede de segurança: o CSS deixa a frase em opacity:0 esperando a classe.
     Se o observador não existir ou falhar, ninguém escreve a classe nunca -
     e a instrução ficaria invisível para sempre, que é o pior desfecho
     possível justamente para o texto que ensina o gesto. */
  function dicasSempre() {
    Array.prototype.forEach.call(dicas, function (d) { d.style.opacity = '1'; });
  }

  if (!dicas.length) {
    /* nada a fazer */
  } else if (reduced || !('IntersectionObserver' in window)) {
    dicasSempre();
  } else {
    try {
      var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          e.target.classList.toggle('is-dizendo', e.isIntersecting);
        });
      }, { rootMargin: '-12% 0px -18% 0px', threshold: 0 });
      Array.prototype.forEach.call(dicas, function (d) { olho.observe(d); });
    } catch (e) {
      dicasSempre();
    }
  }

  /* ---------- prints dos feedbacks: abrem em lightbox (Fancybox) ----------
     Carregado via CDN no <html>; se o script falhar ou nao chegar (offline,
     bloqueador), os links continuam funcionando - abrem a imagem na aba,
     como qualquer <a href> normal. */
  if (window.Fancybox) {
    window.Fancybox.bind('[data-fancybox="prints"]', {
      compact: false,
      Thumbs: false,
      // { left, middle, right } - um array simples aqui quebra o render
      // da toolbar (ficava so o fundo escuro, sem imagem nem botao de fechar)
      Toolbar: { display: { left: [], middle: [], right: ['close'] } },
      Image: { zoom: false }
    });
  }
})();
