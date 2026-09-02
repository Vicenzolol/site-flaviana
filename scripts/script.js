(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;

  document.documentElement.classList.add("js");

  var JA_VIU_INTRO = "fm_intro_vista";
  var introJaVista = false;
  try {
    introJaVista = sessionStorage.getItem(JA_VIU_INTRO) === "1";
  } catch (e) {
    /* modo restrito */
  }
  var introVaiRodar =
    !!document.querySelector("[data-intro]") && !reduced && !introJaVista;

  /* ---------- ano no rodapé ---------- */
  var ano = document.querySelector("[data-ano]");
  if (ano) ano.textContent = new Date().getFullYear();

  var raiz = document.documentElement;
  var btnTema = document.querySelector("[data-tema]");
  var metaCor = document.querySelector('meta[name="theme-color"]');
  var CHAVE_TEMA = "fm_tema";
  var COR = { claro: "#fcfcfc", escuro: "#111011" };

  function aplicarTema(escuro) {
    if (escuro) raiz.setAttribute("data-theme", "dark");
    else raiz.removeAttribute("data-theme");

    if (metaCor)
      metaCor.setAttribute("content", escuro ? COR.escuro : COR.claro);
    if (btnTema) {
      btnTema.setAttribute("aria-pressed", escuro ? "true" : "false");
      btnTema.setAttribute(
        "aria-label",
        escuro ? "Ativar modo claro" : "Ativar modo escuro",
      );
    }
  }

  if (btnTema) {
    aplicarTema(raiz.getAttribute("data-theme") === "dark");
    btnTema.addEventListener("click", function () {
      var escuro = raiz.getAttribute("data-theme") !== "dark";
      aplicarTema(escuro);
      try {
        localStorage.setItem(CHAVE_TEMA, escuro ? "escuro" : "claro");
      } catch (e) {}
    });
  }

  var relogio = document.querySelector("[data-relogio]");
  if (relogio) {
    var tick = function () {
      var agora = new Date();
      var hora;
      try {
        hora = agora.toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch (e) {
        hora = agora.toLocaleTimeString("pt-BR", { hour12: false });
      }
      relogio.textContent = hora;
    };
    tick();
    // sem movimento: mostra a hora uma vez e para de piscar
    if (!reduced) window.setInterval(tick, 1000);
  }

  /* ---------- marquee: duplica a lista para o loop ficar contínuo ---------- */
  Array.prototype.forEach.call(
    document.querySelectorAll("[data-marquee] .marquee__track"),
    function (track) {
      if (reduced) {
        track.style.animation = "none";
        return;
      }
      track.innerHTML += track.innerHTML;
    },
  );

  var GRUPOS = [
    /* --- grupos: definem o indice (--i) e, se houver, a variante --- */
    [".section__head", ":children"],
    [".grid-2", ":children"],
    [".stats", ".stat"],
    [".datalist", ":children"],
    [".audience__card", ".audience__row"],
    [".niches", ".niche"],
    [".taglist", "li", null, 6],
    [".reelgroup__head", ":children"],
    [".cards", ".card"],
    [".ticks", "li"],
    [".pricelist", ":children"],
    [".extras__grid", ":children"],
    [".reach", ".reach__title"],
    [".reach__grid", ".reach__item"],
    [".cases", ".case"],
    [".feedbacks", ".feedbacks__title, .feedbacks__lede"],
    [".feedbacks__grid", ".feedback"],
    [".extras", "h3"],
    [".chips", ".chip", null, 12],
    ["#faq .container", "details"],
    [".cta-final .container", ":children"],

    [".section__head", "h2", "mask"],
    [".cta-final .container", "h2", "mask"],
    [".stat", "dd", "mask"],
    [".reach__item", ".reach__num", "mask"],
    [".card", ".card__ico", "draw"],
    [".ticks", ".ico", "draw"],
  ];

  function marcarGrupos() {
    GRUPOS.forEach(function (g) {
      var contentor = g[0],
        filhos = g[1],
        variante = g[2],
        teto = g[3];
      Array.prototype.forEach.call(
        document.querySelectorAll(contentor),
        function (pai) {
          var itens =
            filhos === ":children"
              ? Array.prototype.slice.call(pai.children)
              : Array.prototype.slice.call(pai.querySelectorAll(filhos));
          itens.forEach(function (el, i) {
            if (!el.hasAttribute("data-reveal")) {
              el.setAttribute("data-reveal", variante || "");
              el.style.setProperty("--i", teto ? Math.min(i, teto) : i);
            } else if (variante && !el.getAttribute("data-reveal")) {
              // ja tem indice de um grupo anterior: so ganha a variante
              el.setAttribute("data-reveal", variante);
            }
          });
        },
      );
    });
  }
  marcarGrupos();

  var alvos = document.querySelectorAll("[data-reveal]");
  function mostrarTudo() {
    Array.prototype.forEach.call(alvos, function (el) {
      el.classList.add("is-visible");
    });
  }

  if (reduced || !("IntersectionObserver" in window)) {
    mostrarTudo();
  } else {
    try {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              obs.unobserve(e.target);
            }
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
      );
      Array.prototype.forEach.call(alvos, function (el) {
        obs.observe(el);
      });
      window.setTimeout(
        function () {
          if (!document.querySelector("[data-reveal].is-visible"))
            mostrarTudo();
        },
        introVaiRodar ? 2500 + 2600 : 2500,
      );
    } catch (e) {
      mostrarTudo();
    }
  }

  var linksNav = Array.prototype.slice.call(
    document.querySelectorAll('.nav nav a[href^="#"]'),
  );
  if (linksNav.length && "IntersectionObserver" in window) {
    try {
      var secoes = linksNav.map(function (a) {
        return document.querySelector(a.getAttribute("href"));
      });
      var visiveis = [];

      var espiao = new IntersectionObserver(
        function (entries) {
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
            if (i === ativa) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        },
        { rootMargin: "-40% 0px -50% 0px" },
      );

      secoes.forEach(function (s) {
        if (s) espiao.observe(s);
      });
    } catch (e) {
      /* sem destaque de seção - os links seguem normais */
    }
  }

  (function () {
    var regua = document.querySelector("[data-rail]");
    if (!regua) return;

    var itens = Array.prototype.slice.call(
      regua.querySelectorAll(".rail__item"),
    );
    var marcas = itens
      .map(function (li) {
        var a = li.querySelector(".rail__link");
        var href = a ? a.getAttribute("href") : "";
        return {
          li: li,
          a: a,
          alvo:
            href && href.length > 1
              ? document.getElementById(href.slice(1))
              : null,
          secao: li.getAttribute("data-nivel") === "1",
          y: 0,
        };
      })
      .filter(function (m) {
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
        if (!m.alvo.getClientRects().length) {
          m.y = anterior;
        } else {
          var topo = m.alvo.getBoundingClientRect().top + window.pageYOffset;
          m.y = Math.min(1, Math.max(0, (topo - recuo) / total));
        }
        anterior = m.y;
        m.li.style.setProperty("--y", m.y);
        if (m.secao) {
          m.li.style.setProperty(
            "--h",
            Math.min(1, m.alvo.offsetHeight / total),
          );
        }
      });
      regua.setAttribute("data-medida", "");
    }

    /* ---- seção/ponto sendo lido ---- */
    var atual = -1;
    function pintar() {
      var p = window.pageYOffset / faixa();
      // a marca atual é a última que a tinta já passou
      var i = 0;
      for (var k = 0; k < marcas.length; k++) {
        if (marcas[k].y <= p + 0.001) i = k;
      }
      if (i === atual) return;
      atual = i;
      marcas.forEach(function (m, k) {
        // acende o ponto e, junto com ele, a seção que o contém
        var aceso = k === i || (m.secao && k === secaoDe(i));
        if (aceso) m.a.setAttribute("aria-current", "true");
        else m.a.removeAttribute("aria-current");
      });
      if (clonesLista) sincronizarFolha(i);
    }
    function secaoDe(i) {
      for (var k = i; k >= 0; k--) {
        if (marcas[k].secao) return k;
      }
      return -1;
    }

    var agendado = false;
    function agendar() {
      if (agendado) return;
      agendado = true;
      window.requestAnimationFrame(function () {
        agendado = false;
        pintar();
      });
    }

    function remedir() {
      medir();
      atual = -1;
      pintar();
    }

    window.addEventListener("fm:remedir", remedir);

    medir();
    pintar();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", remedir, { passive: true });
    // as fontes e as capas do YouTube chegam depois e mexem na altura da página
    window.addEventListener("load", remedir);
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(remedir);
    // o FAQ abre e fecha respostas: a página cresce e encolhe em uso
    Array.prototype.forEach.call(
      document.querySelectorAll("#faq details"),
      function (d) {
        d.addEventListener("toggle", function () {
          window.setTimeout(remedir, 420);
        });
      },
    );

    /* ---- folha do mobile: a MESMA lista, clonada daqui ---- */
    var folha = document.querySelector("[data-sumario]");
    var abrir = document.querySelector("[data-sumario-abrir]");
    var corpo = folha && folha.querySelector("[data-sumario-corpo]");
    var clonesLista = null;
    var clones = [];
    var voltarFocoFolha = null;

    function sincronizarFolha(i) {
      clones.forEach(function (a, k) {
        if (k === i || (marcas[k].secao && k === secaoDe(i)))
          a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    if (folha && abrir && corpo) {
      var lista = document.createElement("ol");
      lista.className = "folha__lista";
      marcas.forEach(function (m) {
        var li = document.createElement("li");
        li.setAttribute("data-nivel", m.secao ? "1" : "2");
        var a = document.createElement("a");
        a.href = m.a.getAttribute("href");
        a.innerHTML = m.a.querySelector(".rail__rotulo").innerHTML;
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
        abrir.setAttribute("aria-expanded", "false");
        raiz.style.overflow = "";
        if (voltarFocoFolha && voltarFocoFolha.focus) voltarFocoFolha.focus();
      };

      abrir.addEventListener("click", function () {
        voltarFocoFolha = document.activeElement;
        folha.hidden = false;
        abrir.setAttribute("aria-expanded", "true");
        raiz.style.overflow = "hidden";
        var primeiro = folha.querySelector(".folha__fechar");
        if (primeiro) primeiro.focus();
      });

      Array.prototype.forEach.call(
        folha.querySelectorAll("[data-sumario-fechar]"),
        function (b) {
          b.addEventListener("click", fecharFolha);
        },
      );
      // clicou num item: fecha e deixa a âncora nativa levar
      lista.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest("a")) fecharFolha();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") fecharFolha();
      });
      // voltou pro desktop com a folha aberta: a régua reassume
      window.addEventListener(
        "resize",
        function () {
          if (window.innerWidth >= 1100) fecharFolha();
        },
        { passive: true },
      );
    }
  })();

  /* ---------- intro 3D: roda uma vez por sessão ---------- */
  var intro = document.querySelector("[data-intro]");
  var JA_VIU = JA_VIU_INTRO;
  var visto = introJaVista;

  function entrar() {
    body.classList.add("is-entered");
  }

  // rede de seguranca: o hero nunca pode ficar escondido esperando a intro
  window.setTimeout(entrar, 4000);

  function encerrarIntro() {
    if (!intro || intro.classList.contains("is-done")) return;
    intro.classList.add("is-done");
    body.classList.remove("is-intro");
    entrar();
    try {
      sessionStorage.setItem(JA_VIU, "1");
    } catch (e) {}
    window.setTimeout(function () {
      intro.hidden = true;
    }, 950);
  }

  if (!intro || reduced || visto) {
    if (intro) intro.hidden = true;
    entrar();
  } else {
    body.classList.add("is-intro");
    // dispara no próximo frame para a animação começar do estado inicial
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        intro.classList.add("is-playing");
      });
    });
    window.setTimeout(encerrarIntro, 2600);

    intro.addEventListener("click", encerrarIntro);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ")
        encerrarIntro();
    });
  }

  /* ---------- parallax do objeto 3D ---------- */
  var objs = document.querySelectorAll("[data-parallax]");
  var fino = window.matchMedia("(pointer: fine)").matches;
  if (objs.length && fino && !reduced) {
    var pendente = false,
      mx = 0,
      my = 0;

    window.addEventListener(
      "mousemove",
      function (e) {
        mx = (e.clientX / window.innerWidth) * 2 - 1; // -1 .. 1
        my = (e.clientY / window.innerHeight) * 2 - 1;
        if (pendente) return;
        pendente = true;
        window.requestAnimationFrame(function () {
          pendente = false;
          Array.prototype.forEach.call(objs, function (o) {
            o.style.setProperty("--tx", (mx * 14).toFixed(2) + "deg");
            o.style.setProperty("--ty", (-my * 10).toFixed(2) + "deg");
          });
        });
      },
      { passive: true },
    );
  }

  var telaLarga = window.matchMedia("(min-width: 900px)");

  var DESCANSO = 0.42;

  function repousar(k) {
    var sinal = k < 0 ? -1 : 1,
      a = k < 0 ? -k : k;
    if (a <= DESCANSO) return 0;
    var t = (a - DESCANSO) / (1 - DESCANSO);
    if (t < 1) t = t * t * (3 - 2 * t);
    return sinal * t;
  }

  function iniciarLeque(leque) {
    var maos = Array.prototype.slice.call(
      leque.querySelectorAll("[data-fan-hand]"),
    );
    var pontos = Array.prototype.slice.call(
      leque.querySelectorAll("[data-fan-go]"),
    );
    var contador = leque.querySelector("[data-fan-atual]");
    var ligado = false,
      naFila = false,
      maoAtual = -1;

    // altura de rolagem util: o trecho em que o palco fica grudado no topo
    function trilho() {
      return leque.offsetHeight - window.innerHeight;
    }

    function limpar() {
      maos.forEach(function (m) {
        m.style.removeProperty("--k");
        m.style.removeProperty("--ka");
        m.style.zIndex = "";
        m.classList.remove("is-live");
      });
    }

    function pintar() {
      naFila = false;
      if (!ligado) return;
      var curso = trilho();
      if (curso <= 0) return;

      var p = -leque.getBoundingClientRect().top / curso;
      p = p < 0 ? 0 : p > 1 ? 1 : p;

      var n = maos.length;
      maos.forEach(function (m, i) {
        var k = repousar((p * n - i - 0.5) * 2);
        if (k < -1.6) k = -1.6;
        else if (k > 1.6) k = 1.6;
        var ka = k < 0 ? -k : k;
        m.style.setProperty("--k", k.toFixed(3));
        m.style.setProperty("--ka", ka.toFixed(3));
        // a mao mais proxima do centro fica por cima das outras
        m.style.zIndex = String(60 - Math.round(ka * 20));
        m.classList.toggle("is-live", ka < 0.5);
      });

      var atual = Math.floor(p * n);
      if (atual > n - 1) atual = n - 1;
      if (atual !== maoAtual) {
        maoAtual = atual;
        pontos.forEach(function (b, i) {
          b.classList.toggle("is-on", i === atual);
          if (i === atual) b.setAttribute("aria-current", "true");
          else b.removeAttribute("aria-current");
        });
        if (contador) contador.textContent = ("0" + (atual + 1)).slice(-2);
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
        window.scrollTo({ top: alvo, behavior: reduced ? "auto" : "smooth" });
      } catch (e) {
        window.scrollTo(0, alvo); // navegador antigo: sem opcoes
      }
    }

    function conferir() {
      ligado = telaLarga.matches && !reduced;
      leque.classList.toggle("is-on", ligado);
      if (ligado) {
        maoAtual = -1;
        pintar();
      } else limpar();
    }

    pontos.forEach(function (b) {
      b.addEventListener("click", function () {
        irPara(Number(b.getAttribute("data-fan-go")));
      });
    });

    leque.addEventListener("focusin", function (e) {
      if (!ligado || !e.target.closest) return;
      var mao = e.target.closest("[data-fan-hand]");
      if (!mao || mao.classList.contains("is-live")) return;
      irPara(maos.indexOf(mao));
    });

    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener(
      "resize",
      function () {
        maoAtual = -1;
        agendar();
      },
      { passive: true },
    );
    if (telaLarga.addEventListener)
      telaLarga.addEventListener("change", conferir);
    else if (telaLarga.addListener) telaLarga.addListener(conferir);
    conferir();
  }

  var leques = Array.prototype.slice.call(
    document.querySelectorAll("[data-fan]"),
  );
  leques.forEach(iniciarLeque);

  if (leques.length) {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-fan] [data-yt] img"),
      function (img) {
        var id = img.closest("[data-yt]").getAttribute("data-yt");
        var opcoes = ["oardefault", "maxresdefault"];
        (function tentar(i) {
          if (i >= opcoes.length) return;
          var teste = new Image();
          teste.onload = function () {
            // o placeholder cinza do YouTube vem 120x90: nao serve
            if (teste.naturalWidth > 320) img.src = teste.src;
            else tentar(i + 1);
          };
          teste.onerror = function () {
            tentar(i + 1);
          };
          teste.src = "https://i.ytimg.com/vi/" + id + "/" + opcoes[i] + ".jpg";
        })(0);
      },
    );
  }

  /* ---------- caixa de video: o player so nasce no clique ---------- */
  var gatilhos = document.querySelectorAll("[data-yt]");
  if (gatilhos.length) {
    var IG_PERFIL = "https://instagram.com/flavianamarafoni";
    var caixa = null,
      fechar = null,
      moldura = null,
      voltarFoco = null;

    function montarCaixa() {
      caixa = document.createElement("div");
      caixa.className = "lb";
      caixa.hidden = true;
      caixa.innerHTML =
        '<button class="lb__scrim" type="button" aria-label="Fechar vídeo"></button>' +
        '<div class="lb__stack">' +
        '<div class="lb__toprow">' +
        '<a class="lb__ig lb__ig--top" href="' +
        IG_PERFIL +
        '" target="_blank" rel="noopener">' +
        '<svg class="ico" aria-hidden="true"><use href="#i-instagram"/></svg>Ver vídeo no Instagram' +
        "</a>" +
        '<button class="lb__close" type="button">' +
        '<svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg>Fechar' +
        "</button>" +
        "</div>" +
        '<div class="lb__box" role="dialog" aria-modal="true" aria-label="Reels no YouTube"></div>' +
        '<a class="lb__ig lb__ig--bottom" href="' +
        IG_PERFIL +
        '" target="_blank" rel="noopener">' +
        '<svg class="ico" aria-hidden="true"><use href="#i-instagram"/></svg>Acessar meu Instagram' +
        "</a>" +
        "</div>";
      document.body.appendChild(caixa);
      moldura = caixa.querySelector(".lb__box");
      fechar = caixa.querySelector(".lb__close");
      caixa.querySelector(".lb__scrim").addEventListener("click", fecharVideo);
      fechar.addEventListener("click", fecharVideo);
    }

    function abrirVideo(id) {
      if (!caixa) montarCaixa();
      voltarFoco = document.activeElement;
      var f = document.createElement("iframe");
      f.src =
        "https://www.youtube.com/embed/" +
        id +
        "?autoplay=1&rel=0&playsinline=1&modestbranding=1";
      f.title = "Reels no YouTube";
      f.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture";
      f.setAttribute("allowfullscreen", "");
      moldura.appendChild(f);
      caixa.hidden = false;
      raiz.style.overflow = "hidden";
      fechar.focus();
    }

    function fecharVideo() {
      if (!caixa || caixa.hidden) return;
      caixa.hidden = true;
      var f = moldura.querySelector("iframe");
      if (f) f.parentNode.removeChild(f); // remover mata o som na hora
      raiz.style.overflow = "";
      if (voltarFoco && voltarFoco.focus) voltarFoco.focus();
    }

    Array.prototype.forEach.call(gatilhos, function (a) {
      a.addEventListener("click", function (e) {
        // ctrl/cmd/meio: deixa o navegador abrir em aba nova, como sempre
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        abrirVideo(a.getAttribute("data-yt"));
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") fecharVideo();
    });
  }

  (function () {
    var itens = document.querySelectorAll("#faq details");
    if (!itens.length || reduced) return;

    itens.forEach(function (item) {
      var resumo = item.querySelector("summary");
      var resposta = item.querySelector("p");
      if (!resumo || !resposta) return;
      var animando = false;

      resumo.addEventListener("click", function (ev) {
        if (animando) {
          ev.preventDefault();
          return;
        }
        ev.preventDefault();
        animando = true;

        var fechando = item.hasAttribute("open");

        if (fechando) {
          // parte da altura atual e anima até 0
          resposta.style.height = resposta.scrollHeight + "px";
        } else {
          item.setAttribute("open", "");
          resposta.style.height = "0px";
          resposta.style.opacity = "0";
        }

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (fechando) {
              resposta.style.height = "0px";
              resposta.style.opacity = "0";
            } else {
              resposta.style.height = resposta.scrollHeight + "px";
              resposta.style.opacity = "1";
            }
          });
        });

        resposta.addEventListener("transitionend", function fim(e) {
          if (e.propertyName !== "height") return;
          resposta.removeEventListener("transitionend", fim);
          if (fechando) {
            item.removeAttribute("open");
            resposta.style.height = "";
          } else {
            resposta.style.height = "auto";
          }
          animando = false;
        });
      });
    });
  })();

  var ESTREITO = window.matchMedia("(max-width: 860px)");

  function ouvirLargura(fn) {
    if (ESTREITO.addEventListener) ESTREITO.addEventListener("change", fn);
    else if (ESTREITO.addListener) ESTREITO.addListener(fn);
  }

  function iniciarTrilho(trilho) {
    var itens = Array.prototype.filter.call(trilho.children, function (el) {
      return el.nodeType === 1;
    });
    if (itens.length < 2) return;

    var rotulo = trilho.getAttribute("data-trilho-rotulo") || "";

    var nav = document.createElement("nav");
    nav.className = "trilho__nav";
    nav.setAttribute(
      "aria-label",
      rotulo ? "Navegar em " + rotulo : "Navegar nos cartões",
    );

    var dica = document.createElement("span");
    dica.className = "trilho__dica";
    dica.setAttribute("aria-hidden", "true");
    dica.innerHTML =
      '<svg class="ico"><use href="#i-arrastar"/></svg>Arraste ou toque';
    nav.appendChild(dica);

    var bussola = document.createElement("div");
    bussola.className = "trilho__bussola";
    nav.appendChild(bussola);

    var contador = document.createElement("p");
    contador.className = "trilho__count";
    contador.innerHTML = "<b>01</b> / " + ("0" + itens.length).slice(-2);
    bussola.appendChild(contador);

    var pontos = itens.map(function (el, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "trilho__dot";
      b.setAttribute(
        "aria-label",
        "Ir para o item " + (i + 1) + " de " + itens.length,
      );
      b.addEventListener("click", function () {
        irPara(i);
      });
      bussola.appendChild(b);
      return b;
    });

    var ancora = (trilho.closest && trilho.closest(".fan")) || trilho;
    ancora.parentNode.insertBefore(nav, ancora.nextSibling);

    function recuo() {
      return parseFloat(window.getComputedStyle(trilho).paddingLeft) || 0;
    }

    function indice() {
      var fim = trilho.scrollWidth - trilho.clientWidth;
      if (fim > 0 && trilho.scrollLeft >= fim - 2) return itens.length - 1;
      var linha = trilho.getBoundingClientRect().left + recuo();
      var melhor = 0,
        menor = Infinity;
      itens.forEach(function (el, i) {
        var d = Math.abs(el.getBoundingClientRect().left - linha);
        if (d < menor - 1) {
          menor = d;
          melhor = i;
        }
      });
      return melhor;
    }

    function irPara(i) {
      var linha = trilho.getBoundingClientRect().left + recuo();
      var delta = itens[i].getBoundingClientRect().left - linha;
      try {
        trilho.scrollBy({ left: delta, behavior: reduced ? "auto" : "smooth" });
      } catch (e) {
        trilho.scrollLeft += delta; // navegador antigo: sem opções
      }
    }

    var visto = -1,
      naFila = false;
    function pintar() {
      naFila = false;
      var i = indice();
      if (i === visto) return;
      visto = i;
      contador.innerHTML =
        "<b>" +
        ("0" + (i + 1)).slice(-2) +
        "</b> / " +
        ("0" + itens.length).slice(-2);
      pontos.forEach(function (b, k) {
        b.classList.toggle("is-on", k === i);
        if (k === i) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
    }
    function agendar() {
      if (naFila) return;
      naFila = true;
      window.requestAnimationFrame(pintar);
    }

    trilho.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener(
      "resize",
      function () {
        visto = -1;
        agendar();
      },
      { passive: true },
    );

    function conferir() {
      if (ESTREITO.matches) {
        trilho.setAttribute("tabindex", "0");
        trilho.setAttribute("role", "group");
        if (rotulo) trilho.setAttribute("aria-label", rotulo);
        visto = -1;
        agendar();
      } else {
        trilho.removeAttribute("tabindex");
        trilho.removeAttribute("role");
        trilho.removeAttribute("aria-label");
      }
    }
    ouvirLargura(conferir);
    conferir();
  }

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-trilho]"),
    iniciarTrilho,
  );

  var ABAS = [];

  function iniciarAbas(paineis, rotulo, dica) {
    if (paineis.length < 2) return;

    var linha = document.createElement("p");
    linha.className = "abas__dica";
    linha.setAttribute("aria-hidden", "true");
    linha.innerHTML = '<svg class="ico"><use href="#i-toque"/></svg>' + dica;

    var barra = document.createElement("div");
    barra.className = "abas";
    barra.setAttribute("role", "tablist");
    barra.setAttribute("aria-label", rotulo);

    var atual = 0;

    var marca = "aba-" + (ABAS.length + 1);

    var botoes = paineis.map(function (painel, i) {
      if (!painel.id) painel.id = marca + "-painel-" + i;

      var b = document.createElement("button");
      b.type = "button";
      b.className = "abas__aba";
      b.id = marca + "-" + i;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", painel.id);
      b.textContent = painel.getAttribute("data-aba") || String(i + 1);
      b.addEventListener("click", function () {
        mostrar(i, true);
      });
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
        if (estreito) {
          p.setAttribute("role", "tabpanel");
          p.setAttribute("aria-labelledby", botoes[k].id);
        } else {
          p.removeAttribute("role");
          p.removeAttribute("aria-labelledby");
        }
      });
      botoes.forEach(function (b, k) {
        b.setAttribute("aria-selected", k === i ? "true" : "false");
        b.setAttribute("tabindex", k === i ? "0" : "-1");
      });
      // a página encolheu ou cresceu: a régua do sumário mede altura real
      if (avisar) window.dispatchEvent(new CustomEvent("fm:remedir"));
    }

    /* setas do teclado percorrem as abas, como manda o padrão de tablist */
    barra.addEventListener("keydown", function (e) {
      var passo = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!passo) return;
      e.preventDefault();
      var i = (atual + passo + paineis.length) % paineis.length;
      mostrar(i, true);
      botoes[i].focus();
    });

    function conferir() {
      mostrar(atual, false);
    }
    ouvirLargura(conferir);
    conferir();

    ABAS.push({ paineis: paineis, mostrar: mostrar });
  }

  function paineisDe(contentor) {
    return contentor
      ? Array.prototype.filter.call(contentor.children, function (el) {
          return el.nodeType === 1 && el.hasAttribute("data-aba");
        })
      : [];
  }

  iniciarAbas(
    Array.prototype.slice.call(
      document.querySelectorAll("#conteudos [data-aba]"),
    ),
    "Tipos de conteúdo",
    "Toque para trocar de tipo de conteúdo",
  );
  iniciarAbas(
    paineisDe(document.querySelector("#investimento .cards")),
    "Formatos e preços",
    "Toque para ver cada formato e preço",
  );

  function abrirAbaDe(alvo) {
    if (!alvo || !alvo.closest) return false;
    var painel = alvo.closest("[data-aba]");
    if (!painel || !painel.hidden) return false;
    for (var i = 0; i < ABAS.length; i++) {
      var k = ABAS[i].paineis.indexOf(painel);
      if (k > -1) {
        ABAS[i].mostrar(k, true);
        return true;
      }
    }
    return false;
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      abrirAbaDe(document.getElementById(id));
    },
    true,
  );

  // chegou na página já com o hash na URL
  if (location.hash.length > 1) {
    try {
      if (abrirAbaDe(document.getElementById(location.hash.slice(1)))) {
        window.requestAnimationFrame(function () {
          var alvo = document.getElementById(location.hash.slice(1));
          if (alvo && alvo.scrollIntoView) alvo.scrollIntoView();
        });
      }
    } catch (e) {
      /* hash inválido: segue a vida */
    }
  }

  (function () {
    var duvidas = Array.prototype.slice.call(
      document.querySelectorAll("#faq details[data-duvida]"),
    );
    if (duvidas.length < 4) return;

    var ASSUNTOS = [
      ["*", "Todas"],
      ["precos", "Preços"],
      ["atendimento", "Como funciona"],
      ["perfil", "Perfil"],
    ];
    var atual = "precos";

    var linha = document.createElement("p");
    linha.className = "abas__dica";
    linha.setAttribute("aria-hidden", "true");
    linha.innerHTML =
      '<svg class="ico"><use href="#i-toque"/></svg>' +
      "Toque no assunto para filtrar as perguntas";

    var barra = document.createElement("div");
    barra.className = "abas";
    barra.setAttribute("role", "group");
    barra.setAttribute("aria-label", "Filtrar dúvidas por assunto");

    var botoes = ASSUNTOS.map(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "abas__aba";
      b.textContent = a[1];
      b.addEventListener("click", function () {
        aplicar(a[0], true);
      });
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
        var fora =
          estreito &&
          assunto !== "*" &&
          d.getAttribute("data-duvida") !== assunto;
        d.hidden = fora;
        if (!fora && !primeira) primeira = d;
      });

      duvidas.forEach(function (d) {
        d.classList.toggle("e-primeira", d === primeira);
      });

      botoes.forEach(function (b, k) {
        b.setAttribute(
          "aria-pressed",
          ASSUNTOS[k][0] === assunto ? "true" : "false",
        );
      });

      if (avisar) window.dispatchEvent(new CustomEvent("fm:remedir"));
    }

    function conferir() {
      aplicar(atual, false);
    }
    ouvirLargura(conferir);
    conferir();
  })();

  var dicas = document.querySelectorAll(
    ".trilho__dica,.abas__dica,.chips__dica",
  );

  function dicasSempre() {
    Array.prototype.forEach.call(dicas, function (d) {
      d.style.opacity = "1";
    });
  }

  if (!dicas.length) {
    /* nada a fazer */
  } else if (reduced || !("IntersectionObserver" in window)) {
    dicasSempre();
  } else {
    try {
      var olho = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (e) {
            e.target.classList.toggle("is-dizendo", e.isIntersecting);
          });
        },
        { rootMargin: "-12% 0px -18% 0px", threshold: 0 },
      );
      Array.prototype.forEach.call(dicas, function (d) {
        olho.observe(d);
      });
    } catch (e) {
      dicasSempre();
    }
  }

  /* ---------- aviso de cookies (LGPD) ---------- */
  (function () {
    var aviso = document.querySelector("[data-cookies]");
    if (!aviso) return;

    var CHAVE_CONSENTIMENTO = "fm_consentimento";

    function ler() {
      try {
        return localStorage.getItem(CHAVE_CONSENTIMENTO);
      } catch (e) {
        return null;
      }
    }

    function gravar(valor) {
      try {
        localStorage.setItem(CHAVE_CONSENTIMENTO, valor);
      } catch (e) {
        /* modo restrito: vale so para esta visita */
      }
    }

    function mostrar() {
      aviso.hidden = false;
    }

    function esconder() {
      aviso.hidden = true;
    }

    function responder(valor) {
      gravar(valor);
      esconder();
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: valor === "aceito" ? "granted" : "denied",
        });
      }
    }

    var btnAceitar = aviso.querySelector("[data-cookies-aceitar]");
    var btnRecusar = aviso.querySelector("[data-cookies-recusar]");

    if (btnAceitar)
      btnAceitar.addEventListener("click", function () {
        responder("aceito");
      });
    if (btnRecusar)
      btnRecusar.addEventListener("click", function () {
        responder("recusado");
      });

    /* rodape: reabre o aviso para trocar a escolha */
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-cookies-abrir]"),
      function (b) {
        b.addEventListener("click", mostrar);
      },
    );

    /* so aparece para quem ainda nao respondeu, e depois da intro */
    if (!ler()) {
      if (introVaiRodar) window.setTimeout(mostrar, 2600);
      else mostrar();
    }
  })();

  /* ---------- medicao: eventos enviados ao Analytics ----------
     Nada dispara sem consentimento: o gtag esta em modo negado ate o aceite,
     entao estas chamadas simplesmente nao viram cookie nem coleta.
     O mapa completo dos eventos esta em docs/medicao.md.                    */
  (function () {
    function medir(nome, dados) {
      if (typeof window.gtag === "function") window.gtag("event", nome, dados);
    }

    function texto(el, seletor) {
      if (!el) return "";
      var alvo = seletor ? el.querySelector(seletor) : el;
      return alvo ? (alvo.textContent || "").trim().slice(0, 60) : "";
    }

    /* de onde na pagina o clique partiu: da o contexto de qualquer evento */
    function origem(el) {
      if (el.closest(".wa-bar")) return "barra_fixa";
      if (el.closest(".footer")) return "rodape";
      if (el.closest(".nav")) return "nav_topo";
      if (el.closest(".rail")) return "trilho_lateral";
      if (el.closest(".folha")) return "sumario";
      var sec = el.closest("section[id]");
      return sec ? sec.id : "outro";
    }

    /* dispara uma unica vez, quando o elemento entra na tela */
    function aoVer(el, aoEntrar) {
      if (!el || !("IntersectionObserver" in window)) return;
      var olho = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (e) {
            if (!e.isIntersecting) return;
            aoEntrar();
            olho.disconnect();
          });
        },
        { threshold: 0.25 },
      );
      olho.observe(el);
    }

    /* ---------- cliques (um so listener para a pagina inteira) ---------- */
    document.addEventListener("click", function (ev) {
      var alvo = ev.target;
      if (!alvo || !alvo.closest) return;

      /* contato por WhatsApp: o evento que vira orcamento */
      var wa = alvo.closest('a[href*="wa.me"]');
      if (wa) {
        medir("contato_whatsapp", { origem: origem(wa), texto: texto(wa) });
        return;
      }

      /* contato por e-mail: mailto nao entra na medicao automatica do Google */
      var mail = alvo.closest('a[href^="mailto:"]');
      if (mail) {
        medir("contato_email", { origem: origem(mail) });
        return;
      }

      /* Reels assistidos: mostra qual conteudo prende a marca */
      var reel = alvo.closest(".reel__link, .card__ig-top");
      if (reel) {
        var cartao = reel.closest(".fan__card");
        medir("ver_reel", {
          marca: texto(cartao, ".reel__brand"),
          categoria: (function () {
            var grupo = reel.closest("[data-aba]");
            return grupo ? grupo.dataset.aba : "";
          })(),
          plataforma: reel.classList.contains("card__ig-top")
            ? "instagram"
            : "youtube",
        });
        return;
      }

      /* print de feedback ampliado: prova social sendo conferida */
      var print = alvo.closest('[data-fancybox="prints"]');
      if (print) {
        medir("abrir_print", {
          marca: (print.getAttribute("data-caption") || "").slice(0, 60),
        });
        return;
      }

      /* perfil social aberto (os cartoes de Reels ja sairam acima) */
      var social = alvo.closest(
        'a[href*="instagram.com"], a[href*="tiktok.com"]',
      );
      if (social) {
        medir("ver_perfil", {
          rede: social.href.indexOf("tiktok") > -1 ? "tiktok" : "instagram",
          origem: origem(social),
        });
        return;
      }

      /* navegacao por ancora: diz para onde a pessoa pula primeiro */
      var ancora = alvo.closest('a[href^="#"]');
      if (ancora) {
        medir("navegar_secao", {
          secao: ancora.getAttribute("href").slice(1),
          origem: origem(ancora),
        });
        return;
      }

      /* carrossel de Reels avancado: engajamento com o portfolio */
      /* os botoes do carrossel ficam fora do [data-trilho-rotulo]:
         a categoria vem do .reelgroup, que envolve o carrossel inteiro */
      var passo = alvo.closest("[data-fan-go]");
      if (passo) {
        var grupo = passo.closest("[data-aba]");
        medir("navegar_reels", {
          grupo: passo.dataset.fanGo,
          categoria: grupo ? grupo.dataset.aba : "",
        });
        return;
      }

      var sumario = alvo.closest("[data-sumario-abrir]");
      if (sumario) {
        medir("abrir_sumario");
        return;
      }

      var tema = alvo.closest("[data-tema]");
      if (tema) {
        medir("trocar_tema", {
          tema: raiz.getAttribute("data-theme") === "dark" ? "claro" : "escuro",
        });
        return;
      }

      var pular = alvo.closest("[data-intro-skip]");
      if (pular) medir("pular_intro");
    });

    /* ---------- aberturas de bloco ---------- */

    /* duvida da FAQ: diz qual objecao aparece mais */
    Array.prototype.forEach.call(
      document.querySelectorAll("details[data-duvida]"),
      function (d) {
        d.addEventListener("toggle", function () {
          if (d.open) medir("abrir_duvida", { duvida: d.dataset.duvida });
        });
      },
    );

    /* memoria de calculo de um case: a marca foi conferir a conta */
    Array.prototype.forEach.call(
      document.querySelectorAll("details.case"),
      function (d) {
        d.addEventListener("toggle", function () {
          if (d.open)
            medir("abrir_case", {
              marca: texto(d, ".case__brand"),
              metrica: texto(d, ".case__metric"),
            });
        });
      },
    );

    /* ---------- alcance: o que a pessoa chegou a ver ---------- */

    /* tabela de precos alcancada: sinal forte de intencao de contratar */
    aoVer(document.getElementById("investimento"), function () {
      medir("ver_precos");
    });

    /* qual pacote entrou na tela: no mobile os cartoes empilham e separam bem */
    Array.prototype.forEach.call(
      document.querySelectorAll("#investimento .card[data-aba]"),
      function (card) {
        aoVer(card, function () {
          medir("ver_pacote", { pacote: card.dataset.aba });
        });
      },
    );

    /* leu ate o convite final: percorreu a pagina inteira */
    aoVer(document.getElementById("contato"), function () {
      medir("chegou_ao_convite");
    });

    /* ---------- sinais soltos ---------- */

    /* telefone ou e-mail copiado: contato que nao passa por clique em link */
    document.addEventListener("copy", function () {
      var sel = String(window.getSelection ? window.getSelection() : "");
      if (!sel) return;
      var limpo = sel.replace(/[^\dA-Za-z@.]/g, "");
      if (limpo.indexOf("999418357") > -1)
        medir("copiar_contato", { tipo: "telefone" });
      else if (limpo.indexOf("flavianamarafoni@gmail.com") > -1)
        medir("copiar_contato", { tipo: "email" });
    });

    /* erro de JavaScript: avisa que o site quebrou no aparelho de alguem */
    window.addEventListener("error", function (e) {
      medir("erro_js", {
        mensagem: String(e.message || "").slice(0, 100),
        arquivo: String(e.filename || "")
          .split("/")
          .pop()
          .slice(0, 40),
        linha: e.lineno || 0,
      });
    });
  })();

  if (window.Fancybox) {
    window.Fancybox.bind('[data-fancybox="prints"]', {
      compact: false,
      Thumbs: false,
      Toolbar: { display: { left: [], middle: [], right: ["close"] } },
      Image: { zoom: false },
    });
  }
})();
