import { useContext, useCallback } from "react";
import { FilePicker } from "../Components/FilePicker";
import { DropZone } from "../Components/DropZone";
import { Page } from "../Components/Page";
import { PageContent } from "../Components/PageContent";
import { PageHeader } from "../Components/PageHeader";
import { PageTitle } from "../Components/PageTitle";
import { PreferencesContext } from "../Contexts/Preferences";
import type { Locale } from "../Utils/Localization";
import { Localized, useLocalization } from "@fluent/react";
import "./HomePage.css";

export interface HomePageProps {
  onFileSelected: (file: File) => void;
}

export function HomePage(props: HomePageProps) {
  const { onFileSelected } = props;
  const { locale, locales, updateLocale } = useContext(PreferencesContext);
  const { l10n } = useLocalization();

  const handleLocaleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLocale(e.target.value as Locale);
  }, [updateLocale]);

  const handleFilesSelected = useCallback((files: FileList) => {
    onFileSelected(files[0]);
  }, [onFileSelected]);

  return (
    <Page className="page--home">
      <PageHeader>
        <div className="toolbar">
          <PageTitle title="Web Explorer"></PageTitle>
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
          <FilePicker onFiles={handleFilesSelected} />
        </div>
      </PageHeader>
      <PageContent>
        <div className="explorer">
          <DropZone onDropFile={onFileSelected} />
          <div className="supports">
            <Localized id="supported-files">
              <h3>Supported Files</h3>
            </Localized>
            <table>
              <thead>
                <tr>
                  <th>
                    <Localized id="file">File</Localized>
                  </th>
                  <th>
                    <Localized id="extension">Extension</Localized>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <Localized id="pdf-file">PDF File</Localized>
                  </td>
                  <td>.pdf</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="epub-file">EPUB File</Localized>
                  </td>
                  <td>.epub</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="mobi-file">Mobi File</Localized>
                  </td>
                  <td>.mobi</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="azw3-file">Azw3 File</Localized>
                  </td>
                  <td>.azw3 (limited supported)</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="archive-file">Archive File</Localized>
                  </td>
                  <td>.zip .rar .tar.gz</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="guitar-tab-file">Guitar Tab File</Localized>
                  </td>
                  <td>.gp3 .gp4</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="threed-model-file">3D Model File</Localized>
                  </td>
                  <td>.gltf .stl .3mf .obj</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="torrent-file">Torrent File</Localized>
                  </td>
                  <td>.torrent</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="csv-file">CSV File</Localized>
                  </td>
                  <td>.csv</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="wasm-file">WASM File</Localized>
                  </td>
                  <td>.wasm</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="image-file">Image File</Localized>
                  </td>
                  <td>.png .jpg .jpeg .gif .webp .apng .bmp .svg .avif .ico .tiff</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="audio-file">Audio File</Localized>
                  </td>
                  <td>.mp3 .flac .aac .ogg</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="video-file">Video File</Localized>
                  </td>
                  <td>.mp4 .webm .ogg .mov</td>
                </tr>
                <tr>
                  <td>
                    <Localized id="email-file">Email File</Localized>
                  </td>
                  <td>.msg</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </PageContent>
    </Page>
  );
}
