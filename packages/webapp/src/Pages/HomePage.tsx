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
import "./HomePage.css";
import { useLocalization } from "@fluent/react";
import { Dropdown, Option, type OptionOnSelectData, type SelectionEvents } from "@fluentui/react-components";

export interface HomePageProps { }

export function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const { locale, locales, updateLocale } = useContext(PreferencesContext);
  const { l10n } = useLocalization();

  return (
    <Page className="page--home">
      <PageHeader>
        <PageTitle title="Web Explorer"></PageTitle>
        <Dropdown
          className="locale"
          value={l10n.getString(locale)}
          selectedOptions={[locale]}
          onOptionSelect={(_event: SelectionEvents, data: OptionOnSelectData) => {
            if (data.optionValue) {
              updateLocale(data.optionValue as Locale);
            }
          }}
        >
          {locales.map((loc) => (
            <Option key={loc} value={loc}>
              {l10n.getString(loc)}
            </Option>
          ))}
        </Dropdown>
        <FilePicker
          onFiles={(files) => {
            if (files.length > 0) {
              setFile(files[0]);
            }
          }}
        />
      </PageHeader>
      <PageContent>
        {file ? <FileViewer file={file} /> : <DropZone onDropFile={setFile} />}
      </PageContent>
    </Page>
  );
}
