import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const getSessionId = () => {
  let sid = sessionStorage.getItem('visitor_session_id');
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('visitor_session_id', sid);
  }
  return sid;
};

// Global state for presence so multiple hooks can share it
let globalChannel = null;
let globalState = { onlineCount: 0, visitorCount: 0, adminUsers: [] };
const listeners = new Set();

const notifyListeners = () => {
  for (const listener of listeners) {
    listener(globalState);
  }
};

export default function useVisitorPresence(shouldTrack = false, user = null) {
  const [localState, setLocalState] = useState(globalState);

  useEffect(() => {
    // Add this component to listeners
    listeners.add(setLocalState);

    // Provide initial state
    setLocalState(globalState);

    const sessioimport { useEffect, useState } from 'react';
iusimport { supabase } from '../supabaseClientha
const getSessionId = () => {
  let sid = se     let sid = sessionStorage.ha  if (!sid) {
    sid = Math.random().toString(36).substes    sid = Ma p    sessionStorage.setItem('visitor_session_id', sid);
  }
  return sid;
};

// Global state for pr()  }
  return sid;
};

// Global state for presence sota  ()};

// Glo  le
 vilet globalChannel = null;
let globalState = { onlineCount:allet globalState = { onlienconst listeners = new Set();

const notifyListeners = () => {
  for (pr
const notifyListeners = ()     for (const listener of listece    listener(globalState);
  }
};
_at   }
};

export defaule {
      
     const [localState, setLocalState] = useState(globalState);

  useEffect(() rr
  useEffect(() => {
    // Add this component to listeners
      // Add this co g    listeners.add(setLocalState);

  t:
    // Provide initial state
         setLocalState(globalSta,

    const sessioimport { useEAdmiusimport { supabase } from '../supabaseClientha
const getS  const getSessi();
    }

    // Effect for tracki  let sid = se     let sid  c    sid = Math.random().toString(36).substes    sid = Ma pnn  }
  return sid;
};

// Global state for pr()  }
  return sid;
};

// Global state for preseemail: user?.email,
    };

// Globa_a
: n  return sid;
};

// Globa  };

// Globa(c
nso
// Glo  le
 vilet globalChannel = nulait for channelet globalState = { onlineC  
const notifyListeners = () => {
  for (pr
const notifyListeners = ()     for (const li     for (pr
const notifyListener  const noad  }
};
_at   }
};

export defaule {
      
     const [localState, setLocalState] = usSO};ri_g()
      
     }).catch(consol     or
  useEffect(() rr
  useEffect(() => {
    // Add this componethe  useEffect(() = i    // Add this cone      // Add this co g    listeners.ari
  t:
    // Provide initial state
         setLocalSt
                setLocalState(globnd
    const sessioimport { useEturn const getS  const getSessi();
    }

    // Effect for tracki  let sid = se    th    }

    // Effect for tra listener  return sid;
};

// Global state for pr()  }
  return sid;
};

// Global state for preseemail: user?.email,
    };
 };

// Globate
ers  return sid;
};

// Globa(g};

// Globa) {
      };

// Globa_a
: n  return sid;
};

// l)
// G   : n  retulC};

// Globa  }      
// Globa(c elnso
// Glou//Tr vilet globconst notifyListeners = () => {
  for (pr
const notifyListeners = ()in  for (pr
const notifyListene itconst no gconst notifyListener  const noad  }
};rror);
      }
    };
_at   }
};

export defaule {
  eturn};

exSt
te;
}
