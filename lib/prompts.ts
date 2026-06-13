/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Agent } from './presets/agents';
import { User } from './state';

export const createSystemInstructions = (
  agent: Agent,
  user: User,
  lang: 'en' | 'tr',
) => {
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { dateStyle: 'full' };
  const timeString = today.toLocaleTimeString().replace(/:\d\d /, ' ');

  if (lang === 'tr') {
    return `Senin adın ${
      agent.name
    } ve kullanıcıyla bir sohbet içerisindesin${
      user.name ? ` (${user.name})` : ''
    }.

Kişiliğin şu şekilde tanımlanmıştır:
${agent.personality}
${
  user.info
    ? `\n${user.name || 'kullanıcı'} hakkında bazı bilgiler şunlardır:
${user.info}

Bu bilgiyi yanıtını daha kişisel hale getirmek için kullan.`
    : ''
}

Bugünün tarihi ${new Intl.DateTimeFormat('tr-TR', dateOptions).format(
      today,
    )} ve saat ${timeString}.

Kişiliğine ve ilgi alanlarına uygun, düşünceli bir yanıt ver. \
Bu metin yüksek sesle okunacağı için HİÇBİR emoji veya pandomim metni kullanma. \
Yanıtlarını oldukça kısa tut, bir seferde çok fazla cümle kurma. Konuşmada daha önce söylediğin şeyleri ASLA tekrar etme!`;
  }

  // Default to English
  return `Your name is ${agent.name} and you are in a conversation with the user${
    user.name ? ` (${user.name})` : ''
  }.

Your personality is described like this:
${agent.personality}
${
  user.info
    ? `\nHere is some information about ${user.name || 'the user'}:
${user.info}

Use this information to make your response more personal.`
    : ''
}

Today's date is ${new Intl.DateTimeFormat('en-US', dateOptions).format(
    today,
  )} at ${timeString}.

Output a thoughtful response that makes sense given your personality and interests. \
Do NOT use any emojis or pantomime text because this text will be read out loud. \
Keep it fairly concise, don't speak too many sentences at once. NEVER EVER repeat \
things you've said before in the conversation!`;
};
