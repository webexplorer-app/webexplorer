import { useState, useContext } from "react";
import { FilePicker } from "../Components/FilePicker";
import { FileViewer } from "../Components/FileViewer";
import { DropZone } from "../Components/DropZone";
import { Page } from "../Components/Page";
import { PageContent } from "../Components/PageContent";
import { PageHeader } from "../Components/PageHeader";
import { PageTitle } from "../Components/PageTitle";
import { PreferencesContext } from "../Contexts/Preferences";
import type { Locale } from "../Utils/Localization";
import { useLocalization } from "@fluent/react";
import "./HomePage.css";

export interface HomePageProps { }

export function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const { locale, locales, updateLocale } = useContext(PreferencesContext);
  const { l10n } = useLocalization();

  return (
    <Page className="page--home">
      <PageHeader>
        <div className="toolbar">
          <PageTitle title="Web Explorer"></PageTitle>
          <select
            className="locale-selector"
            value={locale}
            onChange={(e) => updateLocale(e.target.value as Locale)}
          >
            {locales.map((loc) => (
              <option key={loc} value={loc}>
                {l10n.getString(loc)}
              </option>
            ))}
          </select>
          <FilePicker
            onFiles={(files) => {
              if (files.length > 0) {
                setFile(files[0]);
              }
            }}
          />
        </div>
      </PageHeader>
      <PageContent>
        {file ? <FileViewer file={file} /> : <DropZone onDropFile={setFile} />}
      </PageContent>
    </Page>
  );
}
