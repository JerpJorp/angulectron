# Welcome to the Lecture model app

## How it works

> This application is meant to allow you to record/transcribe meetings and lectures, then use AI to summarize, organize, and analyze the transcript text to help you
understand, review, and study for the lecture content. For each session, you can name it, add tags and notes, and keep track of any audio filecreated. Over time, you will accumulate a list of sessions you can use to analyze for review and study. 

### Glossary

| Term | Definition |
| ----------- | ----------- |
| **Session**  | This application keeps track of sessions, loosely defined as periods during a lecture, meeting, talk, or some kind of spoken interaction |  
| **Transcript**  | A text representation of the audio of a session, either created from an audio file of the session or via live transcription of the audio during the session |
| **Interactions**  | AI prompts that will take the contents of the transcript and analyze them based on a prompt request, like 'create a summary' or 'build a study guide' |
| **Provider**  |  AI models are specific LLMs offered by various AI providers.  For example, OpenAI is a provider and has several models like gpt-4o, gpt-4o-mini, etc |
| **Model**  |  An AI model that this application interacts with via some API. Most models are "chat" style models that handle interactions, but there are others that perform audio transcriptions |
| **Tags**  | You can add tags to sessions to organize them, and use them to filter your list of sessions. Tagging sessions with the class name will allow you to filter the list of classes to that class for later review and study |
| **API key**  | This application interacts with various AI providers via HTTP calls to an API endpoint.  These calls require an API key, a long nonsensical string associated with an account that is set up with billing information to pay for the API calls.  Different models have different costs per request depending on the length of the question and length of the response  |
| **LLM**  | Large Language Model. Pretty much everything you've heard about AI lately are models that qualify as LLMs. |

### Recording and transcription

Primarily, the application captures audio during lectures or meetings in one of two ways
- Recording from your laptop microphone
- Streaming audio from your microphone to a live AI transcription cloude service.

Yuu can do one or both by clicking on 'New Session' from the menu.  Some pointers:
* Live transcription is nice because there is immediate feedback, but it doesn't seem to be as good as recording and then getting a transcription of the audio file
* Recording the full audio and stopping at the end of the lecture results in a large mp3 file on your laptop that you can refer back to later
* If you don't have internet connection during the session, recording is the only option you have anyways

So, ideally you would just record the meeting or choose to both record and live transcribe, but not JUST live transcribe.

### What to do while recording

You can name the session and write notes in name and notes field. Once you stop the session and click the save button, that information is stored as part of the session information.

If you are live transcribing as well, you can watch the live transcription and get distracted by it, but I don't recommend.

So, quickstart:

* start a new session (from menu or nav bar)
* Click on 'Start' under 'Record Audio'
* At the end of the class/lecture/meeting, hit stop
* Confirm the name of the audio file and save it
* Add a name and notes if you want
* Add tags.  I recommend adding tags for your class name or anything else you'd want to filter by once your list of sessions gets longer
* Click the save button

As you create and save session, the app saves the information for each session instance
* path to the audio file if you chose to record
* live transcript content if you chose that option
* date you created the session
* name, notes, and tags you added

---

## After recording

As you go to classes/meetings and record, you will accumulate a list of sessions visible in the 'sessions' menu.  You can select any of these saved session from the list by name. From this list (or right after you have finished saving a new sessiona in the same view), you can use AI to

* transcribe audio to text (if you have a saved audio file)
* use AI interactions to analyze the transcript

#### Transcript tab
* If you used live transcription on the session, you'll see the content of the transcription
* If you recorded an audio file you can request a transcript of the audio (or re-request it) and view the transcript content
* You can edit the content of the transcription if there are any significant mistakes

#### Other tabs
There are other AI 'interactions' you can have with your transcript content.  By default, two are included - a summary and a study guide.  You can request these interactions by clicking the request button, view the results, or even request the interaction again if the transcript has changed or you picked a different provider or model, or changed the prompt for the interaction

*Make sure you save your session changes with the save button after any changes*  

The transcript response and various AI interaction responses are in markdown format.  CLicking on the 'markdown' button will allow you to see the results in a nicely formatted view.  Again, after any tweak or AI prompt response, save the instance. The app will try and auto-save when appropriate, but if the save button is visible, click it to be on the safe side.


Over time, you can go back to your instance list and review your sessions and their transcripts, summaries, study guides, etc.  You can also change your default models/providers or prompts for interactions and go back to your instance list and re-request interactions.  Better prompts and different models have different effects on the quality of the response, and this could be different based on the kind of material in the transcript.
 
---
> There are two kinds of settings you can modify that come with a default set of values.

## Configuration

As it stands, I have a few ways to do recorded transcription, one way to do live transcription, and 3 LLM providers, each with multiple models for doing analysis of the transcript.  I have a few canned prompts you can use, tweak, or add to.

To use these AI providers, you'll need API keys.  I have them.  I'll give them to you, or you can get your own.  Each LLM provider and model for chat or transcription charges different amounts per million tokens or minutes of transcribed audio, and each combination does a better or worse job of handling your prompts and analyzing your transcripts.  You'll have to play around. If more LLM providers or models come around, they can be manually added in the 'AI Model Settings'

When you first open the app you will see this welcome screen, and at the top, if there are no saved API keys, you will be prompted for a password.  The correct password will download the encrypted config file, decrypt it, and set up your app to work with all the AI providers.

## Prompts

There are a few canned prompts.  You can tweak the existing ones or add as many as you want.  Each session with a transcript can be selected in the 'sessions' view, and you can choose to run those prompts and keep the results with the instance, saving and reviewing them later.

---

> There are other ways to take advantage of this application if you haven't used it to record or transcribe a session, but have access to an audio recording or a text transcription

There are a few other cases you might have where you want to use this app:
* you already have an audio file of a lecture or meeting 
* you have a text transcript 
These might be recordings or text files you created from other sources or downloaded from the internet.  You can get these into the app by 
* clicking on the 'Sessions' menu item
* click on 'Create new session'
* copy the path to the audio file into the file box if you have an audio file locally saved on your box or 
* paste in the transcript text on the 'Transcript' tab

Once you've done that, you can follow the flow as if you had created a session in the app (transcribe the audio, run prompts against the transcription).  If you are taking an online class, there may be audio files or transcripts online, and you can use this method to get the file or transcript content into the app so you can use the AI interactions without having to run a session recording.

## Work in progress - current content chat

There is a chat view available from the menu.  For all sessions with transcripts, you can select and ask Perplexity questions.  Unlike other AI providers,
Perplexity can not only analyze the transcript but search the internet for current related information, including wikipedia, technical journals, etc.  I havn't found 
a good prompt yet, but you can play around with it.  Depending on the session transcript, your results may vary.

---

# AI services

- [OpenAI - ChatGPT][https://chatgpt.com/]
- [ChatGPT API][https://platform.openai.com/docs/api-reference/introduction]

- [Anthropic - Claude][https://claude.ai/new]
- [Anthropic API][https://www.anthropic.com/api]

- [Groq][https://groq.com/]
- [LLama][https://llama.meta.com/]
- [Meta AI][https://www.meta.ai/]

- [Deepinfra][https://deepinfra.com/]

- [Perplexity][https://www.perplexity.ai/]

---

### How models work
Modern AI models are based on something called transformer architecture. This architecture was originally developed and published by Google researchers.  RNNs (Recursive Neural Networks) have been around for a long time, but the transormer architecture introduced a concept called attention. When processing natural language, like for translation, it used to be the case that each word was processed on it's own, in order. Attention is a a process where the entire context (sentence, paragraph, whatever) is analyzed and words are contextualized based on where they are in relationship with one another.  A king cobra, the king of pop, and the king of england all have the word king, but yeah, not the same thing.  Part of training the transformer's attention mechanism was to have it predict the next word.  This forced the model to learn grammar, sentence structure, connotations, idioms, and more subtle nuances since it was rewarded for predicting the next word against a huge corpus of text.  These tranformer based architectures got so good at predicting the next word that it became a good idea to just let the model do that - start off with a bit of text and let the model guess the next word, then the next one, and so on.  And the Generative Pretrained Transformer (GPT) was born.

LLMs are first trained on tons of data, like all the data available to humanity.  The results of this training are called **base** models. These models learn grammar, syntax, semantics, patterns, phrases, and all kinds of subtleties of language by getting a rolling masked version of all this text, filling in the next word, and being rewarded/punished for accuracy. Once these models are trained, they are fine tuned to act like chatbots, learning to respond appropriately to the user/assistant conversation pattern.  These fine tuned versions are called **instruct** models.  Part of this fine tuning is to make sure they aren't assholes, don't tell you to do illegal things, aren't pornographic, and basically follow whatever ethical principles the company tries to train into the model.  These **instruct** models are the ones you interact with.  

A big factor with LLMs is the size of their context window.  This just means how much text they can handle in one go.  Remember that the attention mechanism in transformer architectures means that everything in the context is compared to everything else to give it a chance to influence each other, so 1000 tokens (chunks of words) mean that there are 1000 x 1000 contextual influences, a million calculations.  Attention requires the square of the context size for computation for attention, and there are multiple attention heads, like 96 in many cases.  That being said, most major LLMs have at least a context window of 128,000, and some from Google (Gemini 1.5 Pro) have a *2 milion token context window*.  Square that, run the whole thing through what could be a neural network of what could be a trillion parameters, and you can see why these models need massive farms of server warehouses full of special processors that can do matrix multiplication.

## OpenAI / ChatGPT
Google researchers came up with the architecture, but OpenAI pioneered the training, productization, and monetization of LLM chat models.  Starting with GPT 3, OpenAI has had the best LLMs (Large Language Model) by all the benchmarks. Like all LLM providers, they have several sizes, which indicate how many parameters (individual weights) the model uses.  GPT-2 had 1.5 billion parameters, GPT-3 had 175 billion.  With the current GPT-4, OpenAI closed-sourced the model and didn't publish the parameter count.  Rumors are that it could be over a trillion. 

OpenAI is the company behind ChatGPT.  They have several chat LLM models currently:

gpt-4o - this is the flagship model and currently the best by most benchmarks
gpt-4o-mini - a smaller, cheaper and less capable version of gpt-4o

## Anthropic / Claude
Anthropic has been keeping up with OpenAI with their Claude model, the most recent being Claude 3.5 Sonnet.  They offer 3 models of different sizes

Claude 3.5 Sonnet - technical the middle sized model, but their newest and best
Claude 3 Opus - the biggest model, but kind of old
Claude 4 Haiku - their smallest, cheapest model

## Groq
Not to be confused with X/Twitter/Elon Musks' Grok AI Model, Groq is a hardware and infrastructure company that hosts other models. They designed and built their own custom chips, run them in their own server farms, and offer open source models to customers through an API.  Their speed is easily 10x that of any other LLM provider, but they only host midsized open source models.

## Deepinfra
Like Groq, Deepinfa is an LLM hosting company that offers open soure model access through their API.  They offer bigger models than Groq.

---

### About specific models

| Model | info |
| ----------- | ----------- |
| Llama | Meta has Llama 3.1 in 3 different sizes - 8 billion, 70 billion, and 405 billion.  THe 405 billion parameter model is very competitive with the best from OpenAI and Anthropic, and is available in this app through Deepinfra, an AI model hosting service. |
| Grok | X/Twitter/Musk Grok is also competitive, but it's only available through a paid membership to X, and not via an API call.   |
| Gemini | Google has several Gemini 1.5 models that are good, but aren't as good as Llama/Anthropic/OpenAI for the same price point, so I didn't include them as options. That may change in the future. |
| Other open source | There are dozens of other viable open source models, and more being created, fine tuned, merged, and published all the time |
| Transcription |  There are two AI transcription model types.  OpenAI created a model called **Whisper**, and it takes an audio file and returns the text transcript of its content.  This model is available through the OpenAI api and the Groq api.  I set Groq as the default as it's way faster and a tiny bit cheaper per hour of transcription time. |
| AssemblyAI | The other kind is streaming transcription, and the only provider I found is AssemblyAI.  Honestly, it's not as good, but it's pretty good. | 
| Perplexity | Perplexity is an AI provider that has it's own models but also uses other major LLM models. The big difference is that Perplexity searches the internet for any related content to your question and uses it to reply.  All other models only know what they knew when they were trained, so Perplexity has a huge advantage when it comes to including current events and dynamic content from research papers, social media, etc. | 

---

### Other references
[Github repository][https://github.com/JerpJorp/angulectron]



