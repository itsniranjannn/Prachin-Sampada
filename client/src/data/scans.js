// 3D scans of the real monuments, published on Sketchfab by their makers and shown through Sketchfab's official
// embed player (the model stays hosted on Sketchfab with the author's credit). Each was checked by eye to be the
// right site. `site` scans show the monument as a whole; `detail` scans show one shrine or sculpture there.
const S = (uid, title, author, user, license = 'Sketchfab Standard (embed)', kind = 'site') => ({ uid, title, author, user, license, kind });

export const SCANS = {
  pashupatinath: [S('d1dbd0e3109548f3a99ae4a2eca1493b', 'Pashupatinath Temple 3D', 'hellopathway3d', 'hellopathway3d')],
  swayambhunath: [
    S('5da6a460cc3648dd955410f074555ed0', 'Swayambhu Shrine', 'Brad Erickson', 'brerick', undefined, 'detail'),
    S('1114c3da452c423c868aa91216310edc', 'Swayambhunath Vajra', 'Brad Erickson', 'brerick', undefined, 'detail'),
    S('ad0c99960e7745708e7a9c1ef5c3b7ad', 'Temple at Swayambhunath', 'Brad Erickson', 'brerick', undefined, 'detail'),
    S('38def5caf9dc43b4aa1b6fd5ba36c8bb', 'Small Chaitya at Swayambhunath', 'Brad Erickson', 'brerick', undefined, 'detail'),
  ],
  kasthamandap: [S('a172a6c625a84181b68fa4284679de1e', 'Kasthamandap Rebuilding Process', 'Bhugol Tour', 'Raj.Bikram.Maharjan', 'CC Attribution')],
  'krishna-mandir': [S('4c6ef407951a48f89fd8a5fa5a30a728', 'Krishna Mandir', 'Rabit', 'rabitkhaitu')],
  'maya-devi-temple-lumbini': [S('4cdd98a88d3740ccb55c7510725bd98c', 'Maya Devi Temple, Lumbini', 'Bhugol Tour', 'Raj.Bikram.Maharjan')],
  'janaki-mandir': [S('5dd02e87db4541259996fbb74fcdd90c', 'Janaki Mandir', 'Ajaya Tamang Moktan', 'ajaa', 'CC Attribution')],
  dharahara: [S('d1f4f130274649aa912a69fb5b420ff6', 'Dharahara Bhimsen Tower', 'Az_Media_Works', 'Az_Media_Works')],
  namobuddha: [S('a2ea16d02a1d4519acc18bb16739f374', 'Namo Buddha (Historical Stupa)', 'Brad Erickson', 'brerick')],
  'rani-pokhari': [S('69355a5b33724a5797f1adfeae407e56', 'Ranipokhari', 'oiesudip', 'oiesudip')],
  tilaurakot: [S('b712936720594f8fb155338178e6495b', 'Samai Mai shrine, Tilaurakot-Kapilavastu', 'UNESCO Chair, Durham University', 'unescochairdurham', undefined, 'detail')],
  'sundari-chowk-tusha-hiti': [
    S('f28f591bf1ca4584aa31869d5087d7f2', 'Sundari Chowk', 'Nischal Ghinanju', 'shresthanischal1'),
    S('ce8da16035a74f48a6c751e469d73389', 'Tusha Hiti', 'kingvajra', 'kingvajra', undefined, 'detail'),
  ],
  'kal-bhairav': [S('0db5beb3c6cb45f2b6c3fb63cc342044', 'Kal Bhairav, Kathmandu', 'Bhugol Tour', 'Raj.Bikram.Maharjan')],
  'changu-narayan-temple': [S('36d74ba2f7f54286950f2f8cb7d8beee', 'Small temple at Changu Narayan', 'Shawn', 'xwshawn', undefined, 'detail')],
  'kathmandu-durbar-square': [
    S('545cfb81d2334029b9796f532a54d86b', 'Kathmandu Durbar Square', 'Visualising Heritage', 'visualisingheritage'),
    S('1c6e440cb0534c328fc0ae6996e08ff0', 'Post-earthquake Kathmandu Durbar Square', 'Matthew Schroyer', 'mschroyer', undefined, 'detail'),
  ],
  'bhaktapur-durbar-square': [S('3f47fd86609c4b8b8cc1a365a4b1d956', 'Bhaktapur Durbar Square', 'Visualising Heritage', 'visualisingheritage')],
};

export const embedUrl = (uid) => `https://sketchfab.com/models/${uid}/embed?autostart=0&ui_theme=dark&dnt=1&ui_infos=0&ui_watermark_link=0`;
export const modelUrl = (uid) => `https://sketchfab.com/3d-models/${uid}`;
