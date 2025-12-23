import "./App.css";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { HomePage } from "./Pages/HomePage";
import { ViewerPage } from "./Pages/ViewerPage";
import { ReactLocalization, LocalizationProvider } from "@fluent/react";
import { useState, useEffect, useCallback } from "react";
import {
  createReactLocalization,
  localizations,
  type Locale,
  locales,
} from "./Utils/Localization";
import { negotiateLanguages } from "@fluent/langneg";
import Cookie from "js-cookie";
import { PreferencesContext } from "./Contexts/Preferences";
import type { Channel } from "./Utils/channel";

const localeCookieName = "Locale";

export type AppEvent = {
  key: "upgrade";
};

export type AppProps = {
  channel: Channel<AppEvent>;
};

function App(props: AppProps) {
  const { channel } = props;
  const [locale, setLocale] = useState(() => {
    const locale = Cookie.get(localeCookieName) as Locale;
    if (locale) {
      return locale;
    } else {
      const locales = negotiateLanguages(
        navigator.languages,
        Object.keys(localizations),
        { defaultLocale: "en-US" }
      ) as Locale[];
      return locales[0];
    }
  });

  const [l10n, setL10n] = useState<ReactLocalization>(() => {
    return createReactLocalization(locale);
  });

  useEffect(() => {
    const localization = createReactLocalization(locale);
    setL10n(localization);
  }, [locale, setL10n]);

  const updateLocale = useCallback(
    (locale: Locale) => {
      Cookie.set(localeCookieName, locale);
      setLocale(locale);
    },
    [setLocale]
  );

  useEffect(() => {
    const unsubscription = channel.subscribe((evt) => {
      switch (evt.key) {
        case "upgrade":
      }
    });

    return unsubscription;
  }, [channel]);

  return (
    <PreferencesContext.Provider value={{ locale, locales, updateLocale }}>
      <LocalizationProvider l10n={l10n}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LocalizationProvider>
    </PreferencesContext.Provider>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelected = useCallback((file: File) => {
    setFile(file);
    navigate("/viewer");
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<HomePage onFileSelected={handleFileSelected} />}></Route>
      <Route path="/viewer" element={<ViewerPage file={file} />}></Route>
    </Routes>
  );
}

export default App;
