import { useEffect, useState } from "react";
import { type Song, parse } from "@webexplorer/gtp";
import { Dropdown, Option, Label, makeStyles, type OptionOnSelectData, type SelectionEvents } from "@fluentui/react-components";

const useStyles = makeStyles({
  gtpViewer: {
    margin: "1rem",
    "& h4": {
      margin: "2rem 0 0.5rem 0",
      fontSize: "1.5rem",
      textAlign: "center",
    },
    "& p": {
      margin: "0.25rem 0",
      fontSize: "1rem",
      textAlign: "center",
    },
  },
  tab: {
    display: "grid",
    columnGap: "1rem",
    rowGap: "1rem",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    width: "100%",
  },
  voice: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
  },
  beat: {
    flex: "1",
  },
  guitarString: {
    position: "relative",
    display: "inline-block",
    width: "100%",
    height: "1px",
    backgroundColor: "black",
    backgroundPosition: "center center",
  },
  note: {
    position: "absolute",
    top: "50%",
    left: "50%",
    margin: "0",
    padding: "0",
    transform: "translate(-50%, -50%)",
  },
});

export type GtpViewerProps = {
  file: File;
};

export function GtpViewer(props: GtpViewerProps) {
  const { file } = props;
  const [gtp, setGtp] = useState<Song | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);

  useEffect(() => {
    async function render() {
      const reader = new FileReader();
      reader.onload = () => {
        const gtp = parse(reader.result as ArrayBuffer);
        if (gtp) {
          setGtp(gtp);
        }
      };

      reader.readAsArrayBuffer(file);
    }

    render();
  }, [file, setGtp]);

  const styles = useStyles();

  if (!gtp) {
    return null;
  }

  const track = gtp.tracks[trackIndex];

  return (
    <div className={styles.gtpViewer}>
      <header>
        <h4>{gtp.info.title}</h4>
        <p>{gtp.info.artist}</p>
        <p>{gtp.info.album}</p>
      </header>
      <div>
        <Label htmlFor="track-select">Track: </Label>
        <Dropdown
          id="track-select"
          value={track.name}
          selectedOptions={[trackIndex.toString()]}
          onOptionSelect={(_event: SelectionEvents, data: OptionOnSelectData) => {
            if (data.optionValue) {
              setTrackIndex(parseInt(data.optionValue, 10));
            }
          }}
        >
          {gtp.tracks.map((track, index) => (
            <Option key={index} value={index.toString()}>
              {track.name}
            </Option>
          ))}
        </Dropdown>
        <div className={styles.tab}>
          {gtp.measureHeaders.map((_measureHeader, measureIndex) => {
            const measure = track.measures[measureIndex];
            return (
              <div key={measureIndex}>
                {measure.voices.map((voice, voiceIndex) => {
                  return (
                    <div key={voiceIndex} className={styles.voice}>
                      {voice.beats.map((beat, beatIndex) => {
                        return (
                          <div className={styles.beat} key={beatIndex}>
                            {track.strings.map((string, stringIndex) => {
                              const note = beat.notes.find((note) => {
                                return note.string === string.index;
                              });

                              return (
                                <div
                                  className={styles.guitarString}
                                  key={stringIndex}
                                >
                                  <p className={styles.note}>{note?.value}</p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GtpViewer;
