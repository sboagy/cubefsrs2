import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { lazy } from "solid-js";
import App from "./App";
import "./styles/tailwind.css";
import { initAlgs } from "@/stores/algs";
import { initFsrs } from "@/stores/fsrs";

const PracticeView = lazy(() => import("@/views/PracticeView"));
const NewAlgView = lazy(() => import("@/views/NewAlgView"));
const OptionsView = lazy(() => import("@/views/OptionsView"));
const HelpView = lazy(() => import("@/views/HelpView"));
const AlgLibraryView = lazy(() => import("@/views/AlgLibraryView"));
const BuildView = lazy(() => import("@/views/BuildView"));

initAlgs();
initFsrs();

const root = document.getElementById("app");
if (!root) throw new Error("#app element not found");
render(
  () => (
    <Router root={App}>
      <Route path="/" component={PracticeView} />
      <Route path="/new" component={NewAlgView} />
      <Route path="/options" component={OptionsView} />
      <Route path="/help" component={HelpView} />
      <Route path="/library" component={AlgLibraryView} />
      <Route path="/build" component={BuildView} />
    </Router>
  ),
  root,
);
