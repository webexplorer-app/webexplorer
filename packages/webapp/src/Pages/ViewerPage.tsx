import { useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { FileViewer } from "../Components/FileViewer";
import { Page } from "../Components/Page";
import { PageContent } from "../Components/PageContent";
import { PageHeader } from "../Components/PageHeader";
import { PageTitle } from "../Components/PageTitle";
import { PreferencesContext } from "../Contexts/Preferences";
import type { Locale } from "../Utils/Localization";
import { Localized, useLocalization } from "@fluent/react";
import "./ViewerPage.css";

export interface ViewerPageProps {
  file: File | null;
}

export function ViewerPage(props: ViewerPageProps) {
  const { file } = props;
  const { locale, locales, updateLocale } = useContext(PreferencesContext);
  const { l10n } = useLocalization();
  const navigate = useNavigate();

  useEffect(() => {
    if (!file) {
      navigate("/");
    }
  }, [file, navigate]);

  const handleBackClick = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleLocaleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLocale(e.target.value as Locale);
  }, [updateLocale]);

  if (!file) {
    return null;
  }

  return (
    <Page className="page--viewer">
      <PageHeader>
        <div className="toolbar">
          <button onClick={handleBackClick} className="back-button">
            <ArrowLeftIcon />
            <Localized id="back-to-home">Back to Home</Localized>
          </button>
          <PageTitle title={file.name}></PageTitle>
          <select
            className="locale-selector"
            value={locale}
            onChange={handleLocaleChange}
          >
            {locales.map((loc) => (
              <option key={loc} value={loc}>
                {l10n.getString(loc)}
              </option>
            ))}
          </select>
        </div>
      </PageHeader>
      <PageContent>
        <FileViewer file={file} />
      </PageContent>
    </Page>
  );
}
