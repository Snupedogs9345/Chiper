import { useEffect, useRef, useState } from "react";
import counterstrikeLogo from "../assets/counterstrike.svg";
import deadlockLogo from "../assets/Deadlock.svg";
import dota2Logo from "../assets/dota2.svg";
import epicgamesLogo from "../assets/epicgames.svg";
import gamePluginsLogo from "../assets/game-plugins.svg";
import gameLogo from "../assets/game.svg";
import godotengineLogo from "../assets/godotengine.svg";
import logoMark from "../assets/logo.svg";
import steamLogo from "../assets/steam.svg";
import teamFortress2Logo from "../assets/team-fortress-2.svg";
import unityLogo from "../assets/unity.svg";
import unrealLogo from "../assets/unreal-engine.svg";
import verifiedIcon from "../assets/verified.svg";

const cards = [
  {
    tag: "Утечка",
    game: "Mass Effect",
    title: "Новый sci-fi RPG-проект может выйти в ранний доступ уже осенью",
    text: "Собираем подтвержденные зацепки, датамайны, патчи и скрытые обновления из закрытых веток.",
  },
  {
    tag: "Датамайн",
    game: "Fortnite",
    title: "В тестовой сборке обнаружены неанонсированные режимы и внутриигровые ивенты",
    text: "Публикации строятся вокруг источников, файловых следов, API-изменений и внутренних билдов.",
  },
  {
    tag: "Разработка",
    game: "The Witcher",
    title: "Команда Chiper отслеживает дорожные карты, вакансии и закулисные сигналы студий",
    text: "Платформа ориентирована на тех, кто хочет находить новости до официальных анонсов.",
  },
];

const feed = [
  {
    game: "Battlefield",
    tag: "Утечка",
    title: "Внутренний билд экшена получил новую карту и тестовый PvE-режим",
    meta: "2 часа назад • Insider desk",
  },
  {
    game: "Elden Ring",
    tag: "Датамайн",
    title: "В SteamDB замечены пакеты для неанонсированного DLC крупной RPG",
    meta: "4 часа назад • Data trace",
  },
  {
    game: "Cyberpunk 2077",
    tag: "Разработка",
    title: "Вакансии студии намекают на переход к онлайн-функциям и сезонному контенту",
    meta: "Сегодня • Industry watch",
  },
  {
    game: "GTA 6",
    tag: "Наблюдение",
    title: "Из файлов локализации извлечены названия будущих игровых ивентов",
    meta: "Сегодня • Archive",
  },
];

const gameSuggestions = ["GTA 6", "Fortnite", "Mass Effect", "Elden Ring", "Cyberpunk 2077"];
const formatFilters = ["Все", "Утечки", "Датамайны", "Разработка", "Наблюдение"];

const teammateGameOptions = [
  { value: "Counter-Strike 2", icon: counterstrikeLogo },
  { value: "Dota 2", icon: dota2Logo },
  { value: "Team Fortress 2", icon: teamFortress2Logo },
  { value: "Deadlock", icon: deadlockLogo },
];

const backgroundLogos = [
  { src: steamLogo, className: "bg-logo-steam" },
  { src: unrealLogo, className: "bg-logo-unreal" },
  { src: epicgamesLogo, className: "bg-logo-epic" },
  { src: godotengineLogo, className: "bg-logo-godot" },
  { src: counterstrikeLogo, className: "bg-logo-counter" },
  { src: unityLogo, className: "bg-logo-unity" },
  { src: gamePluginsLogo, className: "bg-logo-plugins" },
  { src: gameLogo, className: "bg-logo-game" },
  { src: logoMark, className: "bg-logo-mark" },
];

const API_HOST = window.location.hostname || "127.0.0.1";
const API_BASE = `http://${API_HOST}:8001/api/auth`;
const POSTS_API = `http://${API_HOST}:8001/api/posts/`;
const TEAMMATES_API = `${API_BASE}/teammates/search/`;

function UserName({ name, isInsider = false, onClick = null }) {
  const content = (
    <>
      <span>{name}</span>
      {isInsider ? <img className="verified-icon" src={verifiedIcon} alt="Verified insider" /> : null}
    </>
  );

  if (isInsider && onClick) {
    return (
      <button type="button" className="user-name user-name-button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <span className="user-name">
      {content}
    </span>
  );
}

function App() {
  const insiderHoverTimerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeFormat, setActiveFormat] = useState("Все");
  const [modalType, setModalType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [insiders, setInsiders] = useState([]);
  const [insidersLoading, setInsidersLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [hoveredInsider, setHoveredInsider] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedInsider, setSelectedInsider] = useState(null);
  const [selectedInsiderLoading, setSelectedInsiderLoading] = useState(false);
  const [showTeammatesPage, setShowTeammatesPage] = useState(false);
  const [isSearchingTeammates, setIsSearchingTeammates] = useState(false);
  const [teammateMatches, setTeammateMatches] = useState([]);
  const [teammatesLoading, setTeammatesLoading] = useState(false);
  const [isGameSelectOpen, setIsGameSelectOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [postImages, setPostImages] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [userForm, setUserForm] = useState({ username: "", email: "", password: "" });
  const [insiderForm, setInsiderForm] = useState({ display_name: "", contact: "", details: "" });
  const [postForm, setPostForm] = useState({ title: "", content: "" });
  const [profileForm, setProfileForm] = useState({ steam_id: "", teammate_games: [] });
  const [formStatus, setFormStatus] = useState({
    type: null,
    message: "",
    errors: {},
    loading: false,
  });

  const normalizedQuery = query.trim().toLowerCase();
  const normalizeFormat = (value) => {
    if (value === "Утечки") {
      return "Утечка";
    }
    if (value === "Датамайны") {
      return "Датамайн";
    }
    return value;
  };

  const matchesFormat = (item) => activeFormat === "Все" || item.tag === normalizeFormat(activeFormat);
  const canAccessTeammates = Boolean(currentUser?.steam_id && currentUser?.teammate_games?.length);

  const filteredCards = cards.filter(
    (card) =>
      matchesFormat(card) &&
      [card.game, card.tag, card.title, card.text].join(" ").toLowerCase().includes(normalizedQuery)
  );
  const filteredFeed = feed.filter(
    (item) =>
      matchesFormat(item) &&
      [item.game, item.tag, item.title, item.meta].join(" ").toLowerCase().includes(normalizedQuery)
  );

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/me/`, { credentials: "include" });
        const data = await response.json();
        if (response.ok && data.user) {
          setCurrentUser(data.user);
          setProfileForm({
            steam_id: data.user.steam_id ?? "",
            teammate_games: data.user.teammate_games ?? [],
          });
        } else {
          setCurrentUser(null);
        }
      } catch (_error) {
        setCurrentUser(null);
      } finally {
        setProfileLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch(POSTS_API);
        const data = await response.json();
        setPosts(response.ok ? data.posts ?? [] : []);
      } catch (_error) {
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    loadPosts();
  }, []);

  useEffect(() => {
    const loadInsiders = async () => {
      try {
        const response = await fetch(`${API_BASE}/insiders/`);
        const data = await response.json();
        setInsiders(response.ok ? data.insiders ?? [] : []);
      } catch (_error) {
        setInsiders([]);
      } finally {
        setInsidersLoading(false);
      }
    };

    loadInsiders();
  }, []);

  useEffect(() => {
    if (!showTeammatesPage || !currentUser) {
      return undefined;
    }

    let cancelled = false;

    const loadTeammateSearch = async () => {
      setTeammatesLoading(true);
      try {
        const response = await fetch(TEAMMATES_API, { credentials: "include" });
        const data = await response.json();
        if (!cancelled && response.ok) {
          setIsSearchingTeammates(Boolean(data.searching));
          setTeammateMatches(data.matches ?? []);
        }
      } catch (_error) {
        if (!cancelled) {
          setTeammateMatches([]);
        }
      } finally {
        if (!cancelled) {
          setTeammatesLoading(false);
        }
      }
    };

    loadTeammateSearch();
    const intervalId = window.setInterval(loadTeammateSearch, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [showTeammatesPage, currentUser]);

  const clearStatus = () => {
    setFormStatus({
      type: null,
      message: "",
      errors: {},
      loading: false,
    });
  };

  const openModal = (type) => {
    setModalType(type);
    setIsGameSelectOpen(false);
    clearStatus();
  };

  const closeModal = () => {
    setModalType(null);
    setIsGameSelectOpen(false);
    setAvatarFile(null);
    setPostImages([]);
    clearStatus();
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();
    setFormStatus({ type: null, message: "", errors: {}, loading: true });

    try {
      const response = await fetch(`${API_BASE}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userForm),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormStatus({
          type: "error",
          message: "Не удалось зарегистрировать пользователя.",
          errors: data.errors ?? {},
          loading: false,
        });
        return;
      }

      setCurrentUser(data.user);
      setProfileForm({
        steam_id: data.user.steam_id ?? "",
        teammate_games: data.user.teammate_games ?? [],
      });
      setUserForm({ username: "", email: "", password: "" });
      setFormStatus({
        type: "success",
        message: "Аккаунт создан. Сессия уже активна.",
        errors: {},
        loading: false,
      });
    } catch (_error) {
      setFormStatus({
        type: "error",
        message: "Backend недоступен. Проверь, что Django сервер запущен на 127.0.0.1:8001.",
        errors: {},
        loading: false,
      });
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setFormStatus({ type: null, message: "", errors: {}, loading: true });

    try {
      const response = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormStatus({
          type: "error",
          message: "Не удалось выполнить вход.",
          errors: data.errors ?? {},
          loading: false,
        });
        return;
      }

      setCurrentUser(data.user);
      setProfileForm({
        steam_id: data.user.steam_id ?? "",
        teammate_games: data.user.teammate_games ?? [],
      });
      setLoginForm({ username: "", password: "" });
      setFormStatus({
        type: "success",
        message: "Вход выполнен.",
        errors: {},
        loading: false,
      });
    } catch (_error) {
      setFormStatus({
        type: "error",
        message: "Backend недоступен. Проверь, что Django сервер запущен на 127.0.0.1:8001.",
        errors: {},
        loading: false,
      });
    }
  };

  const handleInsiderSubmit = async (event) => {
    event.preventDefault();
    setFormStatus({ type: null, message: "", errors: {}, loading: true });

    try {
      const response = await fetch(`${API_BASE}/insider-application/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(insiderForm),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormStatus({
          type: "error",
          message: "Не удалось отправить заявку инсайдера.",
          errors: data.errors ?? {},
          loading: false,
        });
        return;
      }

      setInsiderForm({ display_name: "", contact: "", details: "" });
      setFormStatus({
        type: "success",
        message: "Заявка инсайдера отправлена. Ее можно просмотреть в Django admin.",
        errors: {},
        loading: false,
      });
    } catch (_error) {
      setFormStatus({
        type: "error",
        message: "Backend недоступен. Проверь, что Django сервер запущен на 127.0.0.1:8001.",
        errors: {},
        loading: false,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout/`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_error) {
      // Ignore network errors and still clear UI state.
    }

    setCurrentUser(null);
    setShowTeammatesPage(false);
    setIsSearchingTeammates(false);
    setTeammateMatches([]);
    clearStatus();
    if (modalType === "profile") {
      setModalType(null);
    }
  };

  const startInsiderHover = (post) => {
    clearTimeout(insiderHoverTimerRef.current);
    insiderHoverTimerRef.current = window.setTimeout(() => {
      setHoveredInsider(post.author);
    }, 2000);
  };

  const stopInsiderHover = () => {
    clearTimeout(insiderHoverTimerRef.current);
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    if (!avatarFile) {
      setFormStatus({
        type: "error",
        message: "Выбери изображение для загрузки.",
        errors: {},
        loading: false,
      });
      return;
    }

    setFormStatus({ type: null, message: "", errors: {}, loading: true });

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      formData.append("steam_id", profileForm.steam_id);
      formData.append("teammate_games", profileForm.teammate_games.join("\n"));

      const response = await fetch(`${API_BASE}/profile/`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setFormStatus({
          type: "error",
          message: "Не удалось обновить профиль.",
          errors: data.errors ?? {},
          loading: false,
        });
        return;
      }

      setCurrentUser(data.user);
      setProfileForm({
        steam_id: data.user.steam_id ?? "",
        teammate_games: data.user.teammate_games ?? [],
      });
      setAvatarFile(null);
      setFormStatus({
        type: "success",
        message: "Профиль обновлен.",
        errors: {},
        loading: false,
      });
    } catch (_error) {
      setFormStatus({
        type: "error",
        message: "Backend недоступен. Проверь, что Django сервер запущен на 127.0.0.1:8001.",
        errors: {},
        loading: false,
      });
    }
  };

  const handleProfileSettingsSubmit = async (event) => {
    event.preventDefault();
    setFormStatus({ type: null, message: "", errors: {}, loading: true });

    try {
      const formData = new FormData();
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      formData.append("steam_id", profileForm.steam_id);
      formData.append("teammate_games", profileForm.teammate_games.join("\n"));

      const response = await fetch(`${API_BASE}/profile/`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setFormStatus({
          type: "error",
          message: "Не удалось обновить профиль.",
          errors: data.errors ?? {},
          loading: false,
        });
        return;
      }

      setCurrentUser(data.user);
      setProfileForm({
        steam_id: data.user.steam_id ?? "",
        teammate_games: data.user.teammate_games ?? [],
      });
      setAvatarFile(null);
      setIsGameSelectOpen(false);
      setFormStatus({
        type: "success",
        message: "Профиль обновлен.",
        errors: {},
        loading: false,
      });
    } catch (_error) {
      setFormStatus({
        type: "error",
        message: "Backend недоступен. Проверь, что Django сервер запущен на 127.0.0.1:8001.",
        errors: {},
        loading: false,
      });
    }
  };

  const handlePostSubmit = async (event) => {
    event.preventDefault();
    setFormStatus({ type: null, message: "", errors: {}, loading: true });

    try {
      const formData = new FormData();
      formData.append("title", postForm.title);
      formData.append("content", postForm.content);
      for (const image of postImages) {
        formData.append("images", image);
      }

      const response = await fetch(POSTS_API, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setFormStatus({
          type: "error",
          message: "Не удалось опубликовать пост.",
          errors: data.errors ?? {},
          loading: false,
        });
        return;
      }

      setPosts((current) => [data.post, ...current]);
      setPostForm({ title: "", content: "" });
      setPostImages([]);
      setFormStatus({
        type: "success",
        message: "Пост опубликован.",
        errors: {},
        loading: false,
      });
    } catch (_error) {
      setFormStatus({
        type: "error",
        message: "Backend недоступен. Проверь, что Django сервер запущен на 127.0.0.1:8001.",
        errors: {},
        loading: false,
      });
    }
  };

  const renderStatus = () => {
    if (formStatus.errors.non_field_errors) {
      return <p className="form-message form-message-error">{formStatus.errors.non_field_errors[0]}</p>;
    }

    if (!formStatus.message) {
      return null;
    }

    return (
      <p className={`form-message ${formStatus.type === "error" ? "form-message-error" : "form-message-success"}`}>
        {formStatus.message}
      </p>
    );
  };

  const openInsiderPage = async (username) => {
    if (!username) {
      return;
    }

    setSelectedInsiderLoading(true);
    try {
      const response = await fetch(`${API_BASE}/insiders/${username}/`);
      const data = await response.json();
      if (response.ok) {
        setSelectedInsider(data.insider);
      }
    } catch (_error) {
      setSelectedInsider(null);
    } finally {
      setSelectedInsiderLoading(false);
      setHoveredInsider(null);
      stopInsiderHover();
    }
  };

  const openTeammatesPage = () => {
    if (!currentUser) {
      openModal("login");
      return;
    }

    if (!canAccessTeammates) {
      openModal("profile");
      setFormStatus({
        type: "error",
        message: "Чтобы открыть поиск тимейтов, сначала добавь SteamID и игры в профиле.",
        errors: {},
        loading: false,
      });
      return;
    }

    setSelectedInsider(null);
    setShowTeammatesPage(true);
  };

  const handleStartTeammateSearch = async () => {
    setTeammatesLoading(true);
    try {
      const response = await fetch(`${TEAMMATES_API}start/`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        setFormStatus({
          type: "error",
          message: data.errors?.non_field_errors?.[0] || "Не удалось запустить поиск тимейтов.",
          errors: data.errors ?? {},
          loading: false,
        });
        return;
      }

      setIsSearchingTeammates(Boolean(data.searching));
      setTeammateMatches(data.matches ?? []);
      setFormStatus({
        type: "success",
        message: "Поиск тимейтов запущен.",
        errors: {},
        loading: false,
      });
    } catch (_error) {
      setFormStatus({
        type: "error",
        message: "Backend недоступен. Проверь, что Django сервер запущен на 127.0.0.1:8001.",
        errors: {},
        loading: false,
      });
    } finally {
      setTeammatesLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="background-layer" aria-hidden="true">
        {backgroundLogos.map((item) => (
          <img key={item.className} className={`bg-logo ${item.className}`} src={item.src} alt="" />
        ))}
      </div>

      <header className="topbar shell-box">
        <div className="brand">
          <img className="brand-mark" src={logoMark} alt="Chiper logo" />
          <div>
            <p>chiper</p>
            <span>Сообщество инсайдеров и датамайнеров</span>
          </div>
        </div>
        <div className="topbar-side">
          <nav className="topbar-links">
            <button type="button" className="topbar-link-button" onClick={() => setShowTeammatesPage(false)}>
              Новости
            </button>
            <a href="#topics">Темы</a>
            <a href="#about">О проекте</a>
            <button type="button" className="topbar-link-button" onClick={openTeammatesPage}>
              Поиск тимейтов
            </button>
          </nav>
          <div className="topbar-actions">
            {currentUser ? (
              <>
                {currentUser.is_insider ? (
                  <button type="button" className="primary-action" onClick={() => openModal("post")}>
                    Сделать пост
                  </button>
                ) : null}
                <button type="button" className="ghost-button" onClick={() => openModal("profile")}>
                  Профиль
                </button>
                <button type="button" className="ghost-button" onClick={handleLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <button type="button" className="ghost-button" onClick={() => openModal("login")}>
                  Вход
                </button>
                <button type="button" className="ghost-button" onClick={() => openModal("user")}>
                  Регистрация
                </button>
                <button type="button" className="insider-button" onClick={() => openModal("insider")}>
                  Я инсайдер
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {showTeammatesPage ? (
        <main className="layout shell-box insider-page-layout">
          <div className="insider-page">
            <div className="section-head">
              <span className="section-label">Поиск тимейтов</span>
              <button type="button" className="ghost-button" onClick={() => setShowTeammatesPage(false)}>
                Назад
              </button>
            </div>

            <section className="insider-hero">
              <div className="insider-hero-copy">
                <h1>Поиск тимейтов</h1>
                <p>Раздел открыт, потому что в профиле указан SteamID и заполнен список игр.</p>
                <p className="insider-username">SteamID: {currentUser?.steam_id}</p>
              </div>
            </section>

            <section className="compact-section">
              <div className="section-head">
                <span className="section-label">Игры для поиска тимейтов</span>
              </div>
              <div className="format-filter-list">
                {(currentUser?.teammate_games ?? []).map((game) => (
                  <div key={game} className="teammate-game-chip">
                    {game}
                  </div>
                ))}
              </div>
            </section>
            <div className="teammate-search-actions">
              {isSearchingTeammates ? (
                <p className="teammate-search-status">
                  {teammateMatches.length
                    ? "Поиск активен. Ниже уже есть люди с пересечением по выбранным играм."
                    : "Поиск запущен. Chiper теперь ожидает людей, которые тоже ищут тимейтов для выбранных игр."}
                </p>
              ) : null}
              <button
                type="button"
                className="primary-action teammate-search-button"
                onClick={handleStartTeammateSearch}
                disabled={teammatesLoading}
              >
                {teammatesLoading ? "Ищем..." : "Начать поиск"}
              </button>
            </div>
            <section className="compact-section">
              <div className="section-head">
                <span className="section-label">Найденные тимейты</span>
              </div>
              {teammatesLoading ? (
                <p className="empty-state">Проверяем очередь поиска...</p>
              ) : teammateMatches.length ? (
                <div className="teammate-match-list">
                  {teammateMatches.map((match) => (
                    <article key={match.id} className="teammate-match-card">
                      <div className="teammate-match-head">
                        <div className="sidebar-avatar teammate-match-avatar">
                          {match.avatar_url ? (
                            <img src={match.avatar_url} alt={`${match.username} avatar`} />
                          ) : (
                            <span>{match.username.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="teammate-match-copy">
                          <strong>{match.username}</strong>
                          <p>Общие игры: {match.common_games.join(", ")}</p>
                        </div>
                      </div>
                      <a
                        className="ghost-button teammate-match-link"
                        href={match.steam_profile_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Открыть Steam
                      </a>
                    </article>
                  ))}
                </div>
              ) : isSearchingTeammates ? (
                <p className="empty-state">Пока совпадений нет. Оставь поиск активным и открой страницу во втором браузере.</p>
              ) : (
                <p className="empty-state">Нажми «Начать поиск», чтобы попасть в очередь и увидеть подходящих игроков.</p>
              )}
            </section>
          </div>
        </main>
      ) : selectedInsider ? (
        <main className="layout shell-box insider-page-layout">
          <div className="insider-page">
            <div className="section-head">
              <span className="section-label">Инсайдер</span>
              <button type="button" className="ghost-button" onClick={() => setSelectedInsider(null)}>
                Назад
              </button>
            </div>

            <section className="insider-hero">
              <div className="profile-avatar-large insider-page-avatar">
                {selectedInsider.avatar_url ? (
                  <img src={selectedInsider.avatar_url} alt={`${selectedInsider.display_name} avatar`} />
                ) : (
                  <span>{selectedInsider.display_name.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="insider-hero-copy">
                <h1>
                  <UserName name={selectedInsider.display_name} isInsider />
                </h1>
                <p className="insider-username">@{selectedInsider.username}</p>
                <p>{selectedInsider.details || "Подтвержденный инсайдер Chiper."}</p>
                {selectedInsider.contact ? (
                  <a className="insider-contact" href={selectedInsider.contact} target="_blank" rel="noreferrer">
                    {selectedInsider.contact}
                  </a>
                ) : null}
              </div>
            </section>

            <section className="compact-section">
              <div className="section-head">
                <span className="section-label">Публикации инсайдера</span>
              </div>
              {selectedInsider.posts.length ? (
                <div className="post-list">
                  {selectedInsider.posts.map((post) => (
                    <article className="published-post" key={post.id}>
                      <div className="published-post-head">
                        <div>
                          <span className="card-tag">Пост инсайдера</span>
                          <h3>{post.title}</h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="post-content-trigger"
                        onClick={() =>
                          setSelectedPost({
                            ...post,
                            author: {
                              username: selectedInsider.display_name,
                              is_insider: true,
                              avatar_url: selectedInsider.avatar_url,
                            },
                          })
                        }
                      >
                        <p>{post.content}</p>
                      </button>
                      {post.images.length ? (
                        <div className="post-image-grid">
                          {post.images.map((image) => (
                            <button
                              key={image}
                              type="button"
                              className="post-image-button"
                              onClick={() => setSelectedImage(image)}
                            >
                              <img src={image} alt={post.title} />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">У этого инсайдера пока нет опубликованных постов.</p>
              )}
            </section>
          </div>
        </main>
      ) : (
        <main className="layout shell-box">
        <div className="main-column">
          <section className="lead" id="feed">
            <span className="section-label">Главное</span>
            <h1>Новости, утечки и сигналы из разработки игр.</h1>
            <p className="lead-text">
              Компактная стартовая страница для сообщества, где можно публиковать инсайды, датамайны,
              изменения билдов и ранние признаки будущих анонсов.
            </p>

            <div className="lead-card">
              <span className="card-tag">Материал дня</span>
              <h2>В тестовых ветках замечены файлы, указывающие на крупное обновление франшизы</h2>
              <p>
                Основа под редакционный формат: заголовок, короткое описание, метаданные, категории и
                затем переход к полной публикации.
              </p>
            </div>
          </section>

          <section className="search-panel">
            <div className="search-copy">
              <span className="section-label">Поиск по играм</span>
              <h2>Найди публикации по конкретному тайтлу</h2>
            </div>

            <label className="search-box" htmlFor="game-search">
              <input
                id="game-search"
                type="text"
                placeholder="Например: GTA 6, Fortnite, Elden Ring"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="search-tags">
              {gameSuggestions.map((game) => (
                <button key={game} type="button" onClick={() => setQuery(game)}>
                  {game}
                </button>
              ))}
              {query ? (
                <button type="button" className="clear-button" onClick={() => setQuery("")}>
                  Сбросить
                </button>
              ) : null}
            </div>
          </section>

          <section className="compact-section">
            <div className="section-head">
              <span className="section-label">Посты инсайдеров</span>
            </div>
            {postsLoading ? (
              <p className="empty-state">Загружаем посты...</p>
            ) : posts.length ? (
              <div className="post-list">
                {posts.map((post) => (
                  <article
                    className="published-post"
                    key={post.id}
                    onMouseEnter={() => startInsiderHover(post)}
                    onMouseLeave={() => {
                      stopInsiderHover();
                      setHoveredInsider(null);
                    }}
                  >
                    <div className="published-post-head">
                      <div>
                        <span className="card-tag">Пост инсайдера</span>
                        <h3>{post.title}</h3>
                      </div>
                      <div className="post-author">
                        <UserName
                          name={post.author.username}
                          isInsider={post.author.is_insider}
                          onClick={() => openInsiderPage(post.author.username)}
                        />
                      </div>
                    </div>
                    <button type="button" className="post-content-trigger" onClick={() => setSelectedPost(post)}>
                      <p>{post.content}</p>
                    </button>
                    {post.images.length ? (
                      <div className="post-image-grid">
                        {post.images.map((image) => (
                          <button
                            key={image}
                            type="button"
                            className="post-image-button"
                            onClick={() => setSelectedImage(image)}
                          >
                            <img src={image} alt={post.title} />
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {hoveredInsider?.username === post.author.username ? (
                      <button type="button" className="insider-hover-card" onClick={() => openInsiderPage(post.author.username)}>
                        <div className="hover-card-avatar">
                          {post.author.avatar_url ? (
                            <img src={post.author.avatar_url} alt={`${post.author.username} avatar`} />
                          ) : (
                            <span>{post.author.username.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="hover-card-body">
                          <strong>
                            <UserName name={post.author.username} isInsider={post.author.is_insider} />
                          </strong>
                          <p>Подтвержденный инсайдер Chiper</p>
                        </div>
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">Пока нет опубликованных инсайдерских постов.</p>
            )}
          </section>

          <section className="content">
            <section className="compact-section">
              <div className="section-head">
                <span className="section-label">Свежие публикации</span>
                <a href="#all">Вся лента</a>
              </div>

              <div className="card-grid">
                {filteredCards.map((card) => (
                  <article className="news-card" key={card.title}>
                    <div className="card-meta">
                      <span className="card-tag">{card.tag}</span>
                      <p className="game-name">{card.game}</p>
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                ))}
              </div>
              {!filteredCards.length ? <p className="empty-state">По этому запросу публикации пока не найдены.</p> : null}
            </section>

            <section className="compact-section" id="topics">
              <div className="section-head">
                <span className="section-label">Лента сигналов</span>
              </div>

              <div className="feed-list">
                {filteredFeed.map((item) => (
                  <article className="feed-item" key={item.title}>
                    <span className="feed-game">{item.game}</span>
                    <h3>{item.title}</h3>
                    <p>{item.meta}</p>
                  </article>
                ))}
              </div>
              {!filteredFeed.length ? <p className="empty-state">Сигналов по этой игре сейчас нет.</p> : null}
            </section>
          </section>
        </div>

        <aside className="sidebar">
          <section className="sidebar-card" id="about">
            <span className="section-label">О проекте</span>
            <p>
              Chiper задуман как площадка для публикации игровых инсайдов, датамайнов, следов из патчей,
              вакансий и внутренних изменений студий.
            </p>
          </section>

          <section className="sidebar-card">
            <span className="section-label">Профиль</span>
            {profileLoading ? (
              <p>Проверяем сессию...</p>
            ) : currentUser ? (
              <div className="profile-card">
                <div className="profile-card-main">
                <div className="sidebar-avatar">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={`${currentUser.username} avatar`} />
                  ) : (
                    <span>{currentUser.username.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <strong>
                  <UserName name={currentUser.username} isInsider={currentUser.is_insider} />
                </strong>
                <p className={`role-badge ${currentUser.is_insider ? "role-badge-insider" : ""}`}>
                  {currentUser.is_insider ? "Инсайдер" : "Пользователь"}
                </p>
                <p>{currentUser.email || "Email не указан"}</p>
                <button type="button" className="ghost-button profile-button" onClick={() => openModal("profile")}>
                  Открыть профиль
                </button>
                </div>
                <div className="profile-card-games">
                  <span className="profile-card-games-title">Мои игры</span>
                  <div className="profile-card-games-list">
                    {(currentUser.teammate_games ?? []).length ? (
                      currentUser.teammate_games.map((game) => {
                        const matchedGame = teammateGameOptions.find((option) => option.value === game);

                        return matchedGame ? (
                          <a
                            key={game}
                            className="profile-card-game-icon"
                            href={`https://steamcommunity.com/profiles/${currentUser.steam_id}/`}
                            target="_blank"
                            rel="noreferrer"
                            title={game}
                          >
                            <img src={matchedGame.icon} alt={game} />
                          </a>
                        ) : null;
                      })
                    ) : (
                      <p className="profile-card-games-empty">Игры не выбраны</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="profile-card">
                <p>Ты еще не вошел в аккаунт.</p>
                <button type="button" className="primary-action profile-button" onClick={() => openModal("login")}>
                  Войти
                </button>
              </div>
            )}
          </section>

          <section className="sidebar-card">
            <span className="section-label">Форматы</span>
            <div className="format-filter-list">
              {formatFilters.map((format) => (
                <button
                  key={format}
                  type="button"
                  className={`format-filter ${activeFormat === format ? "format-filter-active" : ""}`}
                  onClick={() => setActiveFormat(format)}
                >
                  {format}
                </button>
              ))}
            </div>
          </section>

          <section className="sidebar-card">
            <span className="section-label">Инсайдеры</span>
            {insidersLoading ? (
              <p>Загружаем список инсайдеров...</p>
            ) : insiders.length ? (
              <div className="insider-list">
                {insiders.map((insider) => (
                  <button
                    key={insider.id}
                    type="button"
                    className="insider-item insider-item-button"
                    onClick={() => openInsiderPage(insider.username)}
                  >
                    <div className="insider-item-head">
                      <div className="insider-item-avatar">
                        {insider.avatar_url ? (
                          <img src={insider.avatar_url} alt={`${insider.name} avatar`} />
                        ) : (
                          <span>{insider.name.slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <strong>
                        <UserName name={insider.name} isInsider />
                      </strong>
                    </div>
                    <p>{insider.details}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p>Пока нет одобренных инсайдеров.</p>
            )}
          </section>
        </aside>
      </main>
      )}

      {selectedInsiderLoading ? (
        <div className="page-loading">
          <div className="shell-box page-loading-box">Загружаем страницу инсайдера...</div>
        </div>
      ) : null}

      {modalType ? (
        <div className="modal-overlay" role="presentation" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal}>
              Закрыть
            </button>

            {modalType === "login" ? (
              <>
                <span className="section-label">Вход</span>
                <h2>Войди в аккаунт</h2>
                <p className="modal-text">Используй никнейм и пароль, которые были созданы при регистрации.</p>
                <form className="register-form" onSubmit={handleLoginSubmit}>
                  <label>
                    Никнейм
                    <input
                      type="text"
                      placeholder="Например: chiper_reader"
                      value={loginForm.username}
                      onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
                    />
                    {formStatus.errors.username ? <span className="field-error">{formStatus.errors.username[0]}</span> : null}
                  </label>
                  <label>
                    Пароль
                    <input
                      type="password"
                      placeholder="Твой пароль"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    />
                    {formStatus.errors.password ? <span className="field-error">{formStatus.errors.password[0]}</span> : null}
                  </label>
                  {renderStatus()}
                  <button type="submit" className="primary-action" disabled={formStatus.loading}>
                    {formStatus.loading ? "Вход..." : "Войти"}
                  </button>
                </form>
              </>
            ) : modalType === "user" ? (
              <>
                <span className="section-label">Регистрация</span>
                <h2>Создай аккаунт обычного пользователя</h2>
                <p className="modal-text">
                  Получи доступ к форуму, обсуждениям, сохраненным материалам и подпискам на игры.
                </p>
                <form className="register-form" onSubmit={handleUserSubmit}>
                  <label>
                    Никнейм
                    <input
                      type="text"
                      placeholder="Например: chiper_reader"
                      value={userForm.username}
                      onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))}
                    />
                    {formStatus.errors.username ? <span className="field-error">{formStatus.errors.username[0]}</span> : null}
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={userForm.email}
                      onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                    />
                    {formStatus.errors.email ? <span className="field-error">{formStatus.errors.email[0]}</span> : null}
                  </label>
                  <label>
                    Пароль
                    <input
                      type="password"
                      placeholder="Минимум 8 символов"
                      value={userForm.password}
                      onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                    />
                    {formStatus.errors.password ? <span className="field-error">{formStatus.errors.password[0]}</span> : null}
                  </label>
                  {renderStatus()}
                  <button type="submit" className="primary-action" disabled={formStatus.loading}>
                    {formStatus.loading ? "Отправка..." : "Зарегистрироваться"}
                  </button>
                </form>
              </>
            ) : modalType === "profile" ? (
              <>
                <span className="section-label">Профиль</span>
                <h2>Текущий аккаунт</h2>
                {currentUser ? (
                  <div className="profile-modal">
                    <div className="profile-avatar-large">
                      {currentUser.avatar_url ? (
                        <img src={currentUser.avatar_url} alt={`${currentUser.username} avatar`} />
                      ) : (
                        <span>{currentUser.username.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="profile-row">
                      <span>Никнейм</span>
                      <strong>
                        <UserName name={currentUser.username} isInsider={currentUser.is_insider} />
                      </strong>
                    </div>
                    <div className="profile-row">
                      <span>Email</span>
                      <strong>{currentUser.email || "Не указан"}</strong>
                    </div>
                    <div className="profile-actions-inline">
                      {currentUser.is_insider ? (
                        <span className="insider-inline-badge">У тебя уже есть статус инсайдера</span>
                      ) : (
                        <button
                          type="button"
                          className="insider-button insider-inline-button"
                          onClick={() => openModal("insider")}
                        >
                          Я инсайдер
                        </button>
                      )}
                    </div>
                    <form className="register-form" onSubmit={handleProfileSettingsSubmit}>
                      <label>
                        Фото профиля
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                        />
                      </label>
                      <label>
                        SteamID
                        <input
                          type="text"
                          placeholder="Например: 7656119..."
                          value={profileForm.steam_id}
                          onChange={(event) =>
                            setProfileForm((current) => ({ ...current, steam_id: event.target.value }))
                          }
                        />
                      </label>
                      <div className="game-select-block">
                        <span className="profile-field-label">Игры для поиска тимейтов</span>
                        <button
                          type="button"
                          className={`game-select-trigger${isGameSelectOpen ? " game-select-trigger-open" : ""}`}
                          onClick={() => setIsGameSelectOpen((current) => !current)}
                        >
                          <span className="game-select-trigger-text">
                            {profileForm.teammate_games.length
                              ? profileForm.teammate_games.join(", ")
                              : "Выбери игры"}
                          </span>
                          <span className="game-select-trigger-icon">{isGameSelectOpen ? "−" : "+"}</span>
                        </button>
                        {isGameSelectOpen ? (
                          <div className="game-select-list">
                            {teammateGameOptions.map((game) => {
                            const isSelected = profileForm.teammate_games.includes(game.value);

                            return (
                              <label
                                key={game.value}
                                className={`game-select-item${isSelected ? " game-select-item-active" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    setProfileForm((current) => ({
                                      ...current,
                                      teammate_games: isSelected
                                        ? current.teammate_games.filter((value) => value !== game.value)
                                        : [...current.teammate_games, game.value],
                                    }))
                                  }
                                />
                                <img src={game.icon} alt="" aria-hidden="true" />
                                <span>{game.value}</span>
                              </label>
                            );
                            })}
                          </div>
                        ) : null}
                      </div>
                      {renderStatus()}
                      <button type="submit" className="primary-action" disabled={formStatus.loading}>
                        {formStatus.loading ? "Сохранение..." : "Сохранить профиль"}
                      </button>
                    </form>
                    <button type="button" className="ghost-button profile-button" onClick={handleLogout}>
                      Выйти из аккаунта
                    </button>
                  </div>
                ) : (
                  <div className="profile-card">
                    <p>Сейчас активной сессии нет.</p>
                    <button type="button" className="primary-action profile-button" onClick={() => openModal("login")}>
                      Перейти ко входу
                    </button>
                  </div>
                )}
              </>
            ) : modalType === "post" ? (
              <>
                <span className="section-label">Новый пост</span>
                <h2>Опубликовать инсайдерский пост</h2>
                <p className="modal-text">
                  Доступно только аккаунтам с ролью инсайдера. После публикации пост сразу появится на главной.
                </p>
                <form className="register-form" onSubmit={handlePostSubmit}>
                  <label>
                    Заголовок
                    <input
                      type="text"
                      placeholder="Короткий и точный заголовок"
                      value={postForm.title}
                      onChange={(event) => setPostForm((current) => ({ ...current, title: event.target.value }))}
                    />
                    {formStatus.errors.title ? <span className="field-error">{formStatus.errors.title[0]}</span> : null}
                  </label>
                  <label>
                    Текст
                    <textarea
                      rows="6"
                      placeholder="Подробности поста"
                      value={postForm.content}
                      onChange={(event) => setPostForm((current) => ({ ...current, content: event.target.value }))}
                    />
                    {formStatus.errors.content ? <span className="field-error">{formStatus.errors.content[0]}</span> : null}
                  </label>
                  <label>
                    Картинки
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => setPostImages(Array.from(event.target.files ?? []))}
                    />
                  </label>
                  {postImages.length ? (
                    <p className="file-help">Выбрано файлов: {postImages.length}</p>
                  ) : null}
                  {renderStatus()}
                  <button type="submit" className="primary-action" disabled={formStatus.loading}>
                    {formStatus.loading ? "Публикация..." : "Опубликовать пост"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <span className="section-label">Insider Access</span>
                <h2>Отправь заявку как инсайдер</h2>
                {currentUser ? (
                  <>
                    <p className="modal-text">
                      Заявка будет привязана к твоему обычному аккаунту. После одобрения админом профиль получит роль
                      инсайдера и доступ к инсайдерским функциям.
                    </p>
                    {currentUser.is_insider ? (
                      <p className="form-message form-message-success">
                        У этого аккаунта уже есть роль инсайдера.
                      </p>
                    ) : (
                      <form className="register-form" onSubmit={handleInsiderSubmit}>
                        <label>
                          Имя или псевдоним
                          <input
                            type="text"
                            placeholder="Как тебя представить на платформе"
                            value={insiderForm.display_name}
                            onChange={(event) =>
                              setInsiderForm((current) => ({ ...current, display_name: event.target.value }))
                            }
                          />
                          {formStatus.errors.display_name ? (
                            <span className="field-error">{formStatus.errors.display_name[0]}</span>
                          ) : null}
                        </label>
                        <label>
                          Контакт
                          <input
                            type="text"
                            placeholder="Telegram, email или другой безопасный канал"
                            value={insiderForm.contact}
                            onChange={(event) =>
                              setInsiderForm((current) => ({ ...current, contact: event.target.value }))
                            }
                          />
                          {formStatus.errors.contact ? (
                            <span className="field-error">{formStatus.errors.contact[0]}</span>
                          ) : null}
                        </label>
                        <label>
                          Что ты публикуешь
                          <textarea
                            rows="4"
                            placeholder="Игры, студии, типы материалов, источники"
                            value={insiderForm.details}
                            onChange={(event) =>
                              setInsiderForm((current) => ({ ...current, details: event.target.value }))
                            }
                          />
                          {formStatus.errors.details ? (
                            <span className="field-error">{formStatus.errors.details[0]}</span>
                          ) : null}
                        </label>
                        {renderStatus()}
                        <button type="submit" className="insider-button wide-button" disabled={formStatus.loading}>
                          {formStatus.loading ? "Отправка..." : "Отправить заявку"}
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="profile-card">
                    <p>Сначала войди в обычный аккаунт, потом отправляй заявку инсайдера.</p>
                    <button type="button" className="primary-action profile-button" onClick={() => openModal("login")}>
                      Перейти ко входу
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}

      {selectedPost ? (
        <div className="modal-overlay" role="presentation" onClick={() => setSelectedPost(null)}>
          <div className="modal-card post-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelectedPost(null)}>
              Закрыть
            </button>
            <span className="section-label">Подробно</span>
            <h2>{selectedPost.title}</h2>
            <div className="post-detail-author">
              <UserName name={selectedPost.author.username} isInsider={selectedPost.author.is_insider} />
            </div>
            <p className="modal-text">{selectedPost.content}</p>
            {selectedPost.images.length ? (
              <div className="post-image-grid">
                {selectedPost.images.map((image) => (
                  <button key={image} type="button" className="post-image-button" onClick={() => setSelectedImage(image)}>
                    <img src={image} alt={selectedPost.title} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedImage ? (
        <div className="modal-overlay image-lightbox" role="presentation" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelectedImage(null)}>
              Закрыть
            </button>
            <img src={selectedImage} alt="Post attachment" className="lightbox-image" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
