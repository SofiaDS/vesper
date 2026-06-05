// Messaggi privati 1:1 (DM) — disponibili da Strato 2 (vedi permessi_e_strati.md §1).
// La destinataria deve accettare la richiesta. Il filtro DM può restringere chi può scrivere.

// TODO: sendDmRequest(fromUserId, toUserId) — invia una richiesta di DM
//        Prerequisiti: mittente Strato 2+, almeno 4-5 messaggi in chatroom, filtro DM ok
//        Se il filtro DM della destinataria blocca la richiesta: messaggio generico al mittente,
//        nessuna notifica alla destinataria, nessun log di reputazione (permessi_e_strati.md §1.1)
// TODO: acceptDmRequest(requestId, userId) — la destinataria accetta la richiesta
// TODO: rejectDmRequest(requestId, userId) — la destinataria rifiuta la richiesta
// TODO: listDmConversations(userId) — lista le conversazioni DM attive
// TODO: getDmMessages(conversationId, offset) — carica i messaggi di una conversazione
// TODO: sendDmMessage(conversationId, senderId, body) — invia un messaggio in una conversazione
// TODO: checkDmFilter(fromUserId, toUserId) — verifica se il filtro DM della destinataria
//        permette la richiesta (lato server, per privacy)
