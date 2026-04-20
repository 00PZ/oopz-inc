README.md:
  qmd mentions: 8 (expect >=5)
  qmd-search in Skill Topology: PRESENT
  02:30 in Daily Cadence: PRESENT
  nightly-qmd-reindex: PRESENT
  .qmd/qmd.yml in File Map: PRESENT
  qmd/BM25 roadmap updated: PRESENT
  em-dashes: ABSENT

Changes made:
  Change A - Data Flow diagram: inserted qmd INDEX box between .evidence/wiki/ and CONSUMER AGENTS
  Change B - Skill Topology DATA LAYER: added qmd-search after knowledge-lint
  Change C - Daily Cadence: added 02:30 nightly-qmd-reindex after 02:00 nightly-wiki-compile
  Change D - File Map: added .qmd/ directory with qmd.yml entry after .paperclip.yaml line
  Change E - Roadmap: marked qmd/BM25 entry as DONE with strikethrough + plan reference

QA output:
  grep -c 'qmd': 8
  grep -c 'qmd-search': 1
  grep -c '02:30': 1
  grep -c 'nightly-qmd-reindex': 1
  grep -c '.qmd/qmd.yml': 1
  grep -n 'em-dash': 0 matches
