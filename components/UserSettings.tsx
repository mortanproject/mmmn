/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import Modal from './Modal';
import { useUI, useUser } from '@/lib/state';

const translations = {
  en: {
    intro:
      'This is a simple tool that allows you to design, test, and banter with custom AI characters on the fly.',
    funInfo: 'Adding this optional info makes the experience more fun:',
    yourName: 'Your name',
    namePlaceholder: 'What do you like to be called?',
    yourInfo: 'Your info',
    infoPlaceholder:
      'Things we should know about you… Likes, dislikes, hobbies, interests, favorite movies, books, tv shows, foods, etc.',
    letsGo: 'Let’s go!',
    languagePrompt: 'Please select a language',
  },
  tr: {
    intro:
      'Bu, özel yapay zeka karakterleri tasarlamanıza, test etmenize ve onlarla sohbet etmenize olanak tanıyan basit bir araçtır.',
    funInfo: 'Bu isteğe bağlı bilgileri eklemek deneyimi daha eğlenceli hale getirir:',
    yourName: 'Adınız',
    namePlaceholder: 'Size nasıl hitap edilmesini istersiniz?',
    yourInfo: 'Hakkınızda bilgi',
    infoPlaceholder:
      'Hakkınızda bilmemiz gerekenler... Beğeniler, beğenmedikler, hobiler, ilgi alanları, favori filmler, kitaplar, diziler, yiyecekler vb.',
    letsGo: 'Başlayalım!',
    languagePrompt: 'Lütfen bir dil seçin',
  },
  ru: {
    intro: 'Это простой инструмент, который позволяет вам на лету создавать, тестировать и общаться с пользовательскими ИИ-персонажами.',
    funInfo: 'Добавление этой дополнительной информации сделает процесс более увлекательным:',
    yourName: 'Ваше имя',
    namePlaceholder: 'Как бы вы хотели, чтобы к вам обращались?',
    yourInfo: 'Информация о вас',
    infoPlaceholder: 'То, что мы должны знать о вас... Симпатии, антипатии, хобби, интересы, любимые фильмы, книги, телешоу, еда и т. д.',
    letsGo: 'Поехали!',
    languagePrompt: 'Пожалуйста, выберите язык',
  },
  ar: {
    intro: 'هذه أداة بسيطة تتيح لك تصميم شخصيات ذكاء اصطناعي مخصصة واختبارها والدردشة معها على الطاير.',
    funInfo: 'إضافة هذه المعلومات الاختيارية يجعل التجربة أكثر متعة:',
    yourName: 'اسمك',
    namePlaceholder: 'ماذا تحب أن نناديك؟',
    yourInfo: 'معلومات عنك',
    infoPlaceholder: 'أشياء يجب أن نعرفها عنك... ما تحبه وما تكرهه، هواياتك، اهتماماتك، أفلامك المفضلة، كتبك، برامجك التلفزيونية، طعامك، إلخ.',
    letsGo: 'هيا بنا!',
    languagePrompt: 'الرجاء اختيار لغة',
  },
};

export default function UserSettings() {
  const { name, info, setName, setInfo } = useUser();
  const { lang, setLang, setShowUserConfig } = useUI();

  function updateClient() {
    setShowUserConfig(false);
  }

  const handleClose = () => {
    // Only allow closing if a language has been selected
    if (lang) {
      setShowUserConfig(false);
    }
  };

  const text = lang ? translations[lang] : translations.en;

  return (
    <Modal onClose={handleClose}>
      <div className="userSettings">
        {lang === null ? (
          <div className="language-selector-enhanced">
            <div className="lang-header">
              <span className="material-symbols-outlined lang-icon">translate</span>
              <h2>Please select a language</h2>
              <h2 className="tr-title">Lütfen bir dil seçin</h2>
            </div>
            <div className="lang-grid">
              <button className="lang-card" onClick={() => setLang('en')}>
                <div className="lang-content">
                  <span className="lang-flag">🇬🇧</span>
                  <span className="lang-title">English</span>
                  <span className="lang-subtitle">Select English language</span>
                </div>
              </button>
              <button className="lang-card" onClick={() => setLang('tr')}>
                <div className="lang-content">
                  <span className="lang-flag">🇹🇷</span>
                  <span className="lang-title">Türkçe</span>
                  <span className="lang-subtitle">Türkçe dilini seçin</span>
                </div>
              </button>
              <button className="lang-card" onClick={() => setLang('ru')}>
                <div className="lang-content">
                  <span className="lang-flag">🇷🇺</span>
                  <span className="lang-title">Русский</span>
                  <span className="lang-subtitle">Выберите русский язык</span>
                </div>
              </button>
              <button className="lang-card" onClick={() => setLang('ar')} dir="rtl">
                <div className="lang-content">
                  <span className="lang-flag">🇸🇦</span>
                  <span className="lang-title">العربية</span>
                  <span className="lang-subtitle">اختر اللغة العربية</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <>
            <p>{text.intro}</p>
            <form
              onSubmit={e => {
                e.preventDefault();
                updateClient();
              }}
            >
              <p>{text.funInfo}</p>

              <div>
                <p>{text.yourName}</p>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={text.namePlaceholder}
                />
              </div>

              <div>
                <p>{text.yourInfo}</p>
                <textarea
                  rows={3}
                  name="info"
                  value={info}
                  onChange={e => setInfo(e.target.value)}
                  placeholder={text.infoPlaceholder}
                />
              </div>

              <button className="button primary">{text.letsGo}</button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
