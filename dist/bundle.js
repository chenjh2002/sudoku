
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const BASE_URL = 'https://sudoku.jonasgeiler.com/';

    const DIFFICULTY_CUSTOM = 'custom';
    const DIFFICULTIES = {
    	veryeasy: 'Very Easy',
    	easy:     'Easy',
    	medium:   'Medium',
    	hard:     'Hard',
    };

    const DEFAULT_SETTINGS = {
    	darkTheme:            false,
    	displayTimer:         true,
    	hintsLimited:         true,
    	hints:                5,
    	highlightCells:       true,
    	highlightSame:        true,
    	highlightConflicting: true,
    };
    const MAX_HINTS = 99999;

    const SUDOKU_SIZE = 9;
    const BOX_SIZE = 3;
    const GRID_LENGTH = SUDOKU_SIZE * SUDOKU_SIZE;
    const GRID_COORDS = [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],[1,8],[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[5,0],[5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8]];
    const CANDIDATE_COORDS = [[1, 1],[1, 2],[1, 3],[2, 1],[2, 2],[2, 3],[3, 1],[3, 2],[3, 3]];

    const SENCODE_SEPARATOR = '-';
    const SENCODE_SEPARATOR_REVERSE = '_';
    const SENCODE_REGEX = new RegExp('^[a-zA-Z0-9]+[' + SENCODE_SEPARATOR + SENCODE_SEPARATOR_REVERSE + '][a-zA-Z0-9]+$');
    const SENCODE_SUDOKU_REGEX = new RegExp('^https://www\\.sudokuwiki\\.org/sudoku\\.htm\\?bd=([0-9]{81})$');


    const BASE62_CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const MODAL_NONE = 'none'; // Modal type when hidden
    const MODAL_DURATION = 400;

    const DROPDOWN_DURATION = MODAL_DURATION;

    const GAME_OVER_CELEBRATIONS = [
    	'Excellent!',
    	'Wow!',
    	'Congratulations!',
    	'Oh yeah!',
    	'Impressive!',
    	'Good work!',
    	'You did great!',
    	'Applause!',
    	'Great!'
    ];

    class Base62 {
    	/**
    	 * @param {BigInt} bigInt
    	 * @returns {string}
    	 */
    	static encode(bigInt) {
    		let base = BigInt(BASE62_CHARSET.length);
    		let result = '';

    		while (0 < bigInt) {
    			result = BASE62_CHARSET.charAt(Number(bigInt % base)) + result;
    			bigInt = bigInt / base;
    		}

    		return result || '0';
    	}

    	/**
    	 * @param {string} base62
    	 * @returns {BigInt}
    	 */
    	static decode(base62) {
    		let base = BigInt(BASE62_CHARSET.length);
    		let result = 0n;

    		for (let i = 0; i < base62.length; i++) {
    			result = result * base + BigInt(BASE62_CHARSET.indexOf(base62[i]));
    		}

    		return result;
    	}
    }

    /**
     * @param {number[]} flatGrid
     * @returns {boolean}
     */
    function shouldReverse(flatGrid) {
    	for (let cell = 0; cell < GRID_LENGTH; cell++) {
    		if (flatGrid[(GRID_LENGTH - 1) - cell] !== 0) {
    			return false;
    		} else if (flatGrid[cell] !== 0) {
    			return true;
    		}
    	}

    	return false;
    }


    /**
     * @param {number[][]} sudoku
     * @returns {string}
     */
    function encodeSudoku(sudoku) {
    	/** @type number[] */
    	const flatGrid = sudoku.flat();

    	const reversed = shouldReverse(flatGrid);
    	if (reversed) {
    		// Reverse sudoku array
    		flatGrid.reverse();
    	}

    	let structure = '';
    	let numbers = '';

    	for (let cell = 0; cell < GRID_LENGTH; cell++) {
    		structure += (flatGrid[cell] === 0 ? '0' : '1');

    		if (flatGrid[cell] > 0) {
    			numbers += flatGrid[cell] - 1; // Subtract 1 so the number gets smaller
    		}
    	}

    	return Base62.encode(BigInt('0b' + structure)) +
    	       (reversed ? SENCODE_SEPARATOR_REVERSE : SENCODE_SEPARATOR) +
    	       Base62.encode(BigInt(numbers));
    }


    /**
     * @param {string} sencode
     * @returns {number[][]}
     */
    function decodeSencode(sencode) {
    	let grid = [
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    	];

    	if (SENCODE_SUDOKU_REGEX.test(sencode)) {
    		let sudokuProblem = SENCODE_SUDOKU_REGEX.exec(sencode)[1];
    		for (let y = 0; y < SUDOKU_SIZE; y++) {
    			for (let x = 0; x < SUDOKU_SIZE; x++) {
    				grid[y][x] = +sudokuProblem[y * SUDOKU_SIZE + x];
    			}
    		}

    		return grid;
    	}

    	const reversed = sencode.indexOf(SENCODE_SEPARATOR_REVERSE) !== -1;

    	const [encodedStructure, encodedNumbers] = sencode.split(reversed ? SENCODE_SEPARATOR_REVERSE : SENCODE_SEPARATOR);

    	const structure = Base62.decode(encodedStructure)
    	                        .toString(2)
    	                        .padStart(GRID_LENGTH, '0');

    	let numberCount = 0;
    	for (let cell = 0; cell < GRID_LENGTH; cell++) {
    		if (structure[cell] === '1') {
    			numberCount++;
    		}
    	}

    	let numbers = Base62.decode(encodedNumbers)
    	                    .toString()
    	                    .padStart(numberCount, '0')
    	                    .split('');

    	for (let cell = 0; cell < GRID_LENGTH; cell++) {
    		if (structure[cell] === '1') {
    			const [row, col] = GRID_COORDS[cell];
    			grid[row][col] = numbers.shift() * 1 + 1;
    		}
    	}

    	if (reversed) {
    		// Reverse Grid
    		grid = grid.reverse().map(row => row.reverse());
    	}

    	return grid;
    }


    /**
     * @param {string} sencode
     * @returns {boolean}
     */
    function validateSencode(sencode) {
    	return sencode && sencode.trim().length !== 0 && (SENCODE_REGEX.test(sencode) || SENCODE_SUDOKU_REGEX.test(sencode));
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function createCursor() {
    	const cursor = writable({ x: null, y: null });

    	return {
    		subscribe: cursor.subscribe,

    		set(x, y) {
    			cursor.set({ x, y });
    		},

    		move(xDir = 0, yDir = 0) {
    			cursor.update($cursor => {
    				let newX = $cursor.x + xDir;
    				let newY = $cursor.y + yDir;

    				if (newX < 0) newX = SUDOKU_SIZE - 1;
    				if (newX >= SUDOKU_SIZE) newX = 0;
    				if (newY < 0) newY = SUDOKU_SIZE - 1;
    				if (newY >= SUDOKU_SIZE) newY = 0;

    				return {
    					x: newX,
    					y: newY,
    				};
    			});
    		},

    		reset() {
    			this.set(null, null);
    		}
    	};
    }

    const cursor = createCursor();

    function createDifficulty() {
    	const difficulty = writable((() => {
    		const storedDifficulty = localStorage.getItem('difficulty');

    		if (DIFFICULTIES.hasOwnProperty(storedDifficulty)) {
    			return storedDifficulty;
    		}

    		return Object.keys(DIFFICULTIES)[0];
    	})());

    	return {
    		subscribe: difficulty.subscribe,

    		set(newDifficulty) {
    			if (DIFFICULTIES.hasOwnProperty(newDifficulty)) {
    				difficulty.set(newDifficulty);
    				localStorage.setItem('difficulty', newDifficulty);
    			}
    		},

    		setCustom() {
    			difficulty.set(DIFFICULTY_CUSTOM);
    		}
    	};
    }

    const difficulty = createDifficulty();

    var CHUNK_SIZE = 3;
    var ROW_COL_SIZE = CHUNK_SIZE * CHUNK_SIZE;
    var SIZE = ROW_COL_SIZE * ROW_COL_SIZE;

    var MIN_HINTS = 17;

    function checkRow(puzzle, number, index) {
      var start = Math.floor(index / ROW_COL_SIZE) * ROW_COL_SIZE;
      for (var i = 0; i < ROW_COL_SIZE; i += 1) {
        if (puzzle[start + i] === number) {
          return false;
        }
      }
      return true;
    }

    function checkCol(puzzle, number, index) {
      var start = index % ROW_COL_SIZE;
      for (var i = 0; i < ROW_COL_SIZE; i += 1) {
        if (puzzle[start + (i * ROW_COL_SIZE)] === number) {
          return false;
        }
      }
      return true;
    }

    function check3x3(puzzle, number, index) {
      var start = index - ((index % ROW_COL_SIZE) % CHUNK_SIZE) -
        (ROW_COL_SIZE * (Math.floor(index / ROW_COL_SIZE) % CHUNK_SIZE));
      for (var i = 0; i < ROW_COL_SIZE; i += 1) {
        if (
          puzzle[start + (ROW_COL_SIZE * Math.floor(i / CHUNK_SIZE)) + (i % CHUNK_SIZE)] === number
        ) {
          return false;
        }
      }
      return true;
    }

    function check(puzzle, number, index) {
      return checkRow(puzzle, number, index) &&
            checkCol(puzzle, number, index) &&
            check3x3(puzzle, number, index);
    }

    var iterations = 0;
    function recursiveSolve(puzzle, index, maxIterations) {
      if (maxIterations !== 0 && ++iterations > maxIterations) {
        throw new Error('Max iterations reached. No solution found.');
      }
      if (index >= SIZE) {
        return true;
      } else if (puzzle[index] !== 0) {
        return recursiveSolve(puzzle, index + 1, maxIterations);
      }

      for (var number = 1; number <= ROW_COL_SIZE; number += 1) {
        if (check(puzzle, number, index)) {
          puzzle[index] = number;
          if (recursiveSolve(puzzle, index + 1, maxIterations)) {
            return true;
          }
        }
      }
      puzzle[index] = 0;
      return false;
    }

    function solve(puzzle, options) {
      var opts = {
        emptyValue: '0',
        hintCheck: true,
        outputArray: false,
        maxIterations: 1<<20,
      };

      if (options !== undefined) {
        Object.assign(opts, options);
      }

      if (typeof puzzle === 'string') {
        puzzle = puzzle.split('');
      }

      if (!Array.isArray(puzzle)) {
        throw new TypeError('Puzzle must be string or array.');
      }

      if (puzzle.length !== SIZE) {
        throw new Error('Puzzle is an invalid size.');
      }

      var hints = 0;
      puzzle = puzzle.map(function(element) {
        if (element === opts.emptyValue || element === parseInt(opts.emptyValue, 10)) {
          return 0;
        }
        hints++;
        var value = parseInt(element, 10);
        if (isNaN(value) || value > 9 || value < 1) {
          throw new TypeError('Invalid puzzle value: ' + element);
        }
        return value;
      });

      if (opts.hintCheck && hints < MIN_HINTS) {
        throw new Error('A valid puzzle must have at least ' + MIN_HINTS + ' hints.');
      }

      if (!recursiveSolve(puzzle, 0, opts.maxIterations)) {
        throw new Error('Puzzle could not be solved.');
      }

      return opts.outputArray ? puzzle : puzzle.join('');
    }

    var sudokuSolver = solve;

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var Random = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRandomIntBetween = function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    };
    });

    var BasePuzzles = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });

    var veryEasy = [
        [
            [null, 8, null, null, null, null, null, null, null],
            [null, 6, null, null, 1, null, null, null, 5],
            [null, null, 5, 8, null, 2, null, 4, 7],
            [null, null, 8, 4, null, null, null, 9, 1],
            [null, 9, null, null, null, null, null, 8, null],
            [null, null, null, 6, null, null, 7, null, null],
            [null, null, null, null, 5, null, null, 3, null],
            [null, null, null, null, null, null, null, null, null],
            [2, 1, null, null, 6, null, null, null, 9]
        ],
        [
            [5, null, 2, null, null, null, null, 1, null],
            [null, null, 7, null, 8, 4, 6, null, null],
            [null, null, null, 3, null, null, null, 2, null],
            [null, 3, null, null, null, 7, null, null, null],
            [8, null, 5, null, null, 6, 2, null, null],
            [null, null, null, 1, 4, null, null, null, null],
            [null, 9, 8, null, null, null, 5, null, null],
            [1, null, null, 6, null, null, 4, null, null],
            [null, 4, null, null, 5, null, null, null, null]
        ],
        [
            [null, null, null, null, null, null, 1, null, null],
            [null, 2, null, 1, 7, null, null, null, 4],
            [null, 7, null, null, null, null, 8, null, 9],
            [5, null, null, null, null, 3, null, null, 7],
            [null, null, null, 8, 4, null, null, null, null],
            [7, null, 2, null, null, 9, 4, null, null],
            [null, null, 8, null, 3, null, null, null, null],
            [4, null, null, 5, null, null, 9, null, 3],
            [null, 1, null, null, null, 8, null, null, null]
        ],
        [
            [null, 4, null, null, 6, null, null, 9, null],
            [null, null, null, null, 7, null, 8, null, 1],
            [null, null, null, 5, null, 8, 2, null, null],
            [2, null, null, null, 8, null, null, null, 5],
            [null, null, 8, null, null, null, null, 1, 2],
            [7, null, null, 9, null, 3, null, null, null],
            [null, null, null, null, 5, 4, 6, null, null],
            [null, null, null, null, null, null, null, null, 3],
            [null, null, null, 7, null, null, null, null, 4]
        ],
        [
            [null, null, null, null, null, null, null, 7, 2],
            [null, null, null, null, 4, null, 6, null, null],
            [null, null, null, null, null, null, 5, null, null],
            [null, null, 6, 4, null, 3, null, 5, null],
            [null, 8, null, null, null, 6, 1, null, null],
            [3, 9, 1, 2, null, null, null, 4, null],
            [7, null, null, null, 8, null, null, null, null],
            [null, null, null, 1, null, null, null, null, null],
            [null, null, 4, 9, 6, null, null, null, 8]
        ],
        [
            [null, null, 9, null, 1, 4, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [3, 6, null, null, null, null, 7, null, 4],
            [8, null, 1, null, null, 5, 9, null, null],
            [4, 2, 7, null, null, null, 6, null, null],
            [null, null, null, null, 7, null, null, null, null],
            [null, null, 4, null, 9, 1, null, 8, null],
            [7, null, null, null, null, null, null, null, 6],
            [null, null, null, 5, null, null, null, 3, null]
        ],
        [
            [null, 6, null, null, null, 5, null, 3, 2],
            [null, 5, null, null, 4, null, 1, null, null],
            [null, null, null, null, 7, null, null, 6, null],
            [null, 1, 3, null, null, null, null, null, null],
            [5, null, null, null, null, 4, null, null, 3],
            [2, null, null, null, null, null, null, null, null],
            [null, 8, null, null, 1, 2, 4, 7, null],
            [null, 4, null, 7, null, null, null, null, 6],
            [null, null, null, null, 6, null, 8, 9, null]
        ],
        [
            [null, 1, null, null, null, null, 3, 4, null],
            [null, null, 2, null, 4, null, null, null, null],
            [null, null, null, null, null, 1, 7, null, 2],
            [9, null, null, 1, null, null, null, null, 5],
            [null, null, null, 6, null, 2, null, 3, 9],
            [1, null, null, 3, null, null, null, null, 4],
            [null, null, null, 5, 2, 7, null, null, null],
            [null, 9, null, null, 8, 6, null, null, null],
            [null, null, null, null, null, null, 2, null, null]
        ],
        [
            [3, null, null, null, null, null, 5, null, null],
            [8, null, 2, null, null, null, null, 7, null],
            [7, 9, null, null, null, 5, null, null, 2],
            [null, null, null, 3, null, 4, 7, null, null],
            [null, null, null, null, null, 6, null, 4, 3],
            [null, 1, null, null, 5, 8, null, 9, null],
            [null, null, null, 6, 2, null, null, 5, null],
            [null, 3, null, null, null, null, 8, null, null],
            [null, null, null, null, null, null, null, 1, null]
        ]
    ];
    var easy = [
        [
            [null, null, null, null, null, null, 2, null, null],
            [9, 7, 6, null, null, null, null, 5, null],
            [null, null, null, null, 8, 3, null, null, null],
            [8, null, 1, null, null, null, null, null, null],
            [5, null, 7, null, null, null, 6, 4, 1],
            [null, null, null, 2, null, null, null, null, null],
            [null, null, null, 8, null, null, null, null, 4],
            [null, 4, null, null, 9, 5, 3, null, 2],
            [7, null, 5, null, null, null, null, null, null]
        ],
        [
            [6, null, null, null, null, null, 3, null, null],
            [null, null, 5, null, 3, 7, null, null, null],
            [null, null, null, 5, null, null, null, null, null],
            [null, 7, null, 3, 8, null, null, 4, null],
            [null, 2, null, null, 1, null, null, null, null],
            [null, null, 8, null, null, 6, null, 9, null],
            [8, null, null, 6, null, 9, null, null, null],
            [null, null, 4, null, null, 8, 7, null, null],
            [null, 9, 2, 7, null, null, null, null, 6]
        ],
        [
            [null, null, 1, null, null, 9, null, 4, null],
            [6, null, null, null, 4, null, null, null, null],
            [null, 2, 8, null, null, null, 9, 3, null],
            [null, null, null, null, null, null, 6, 7, null],
            [null, null, null, 8, null, null, null, null, 4],
            [null, null, null, 5, 2, 4, 3, null, null],
            [null, null, null, 1, null, null, 5, 6, null],
            [null, null, 6, null, null, null, null, null, 2],
            [1, null, 5, 9, null, null, null, null, null]
        ],
        [
            [8, 7, null, null, null, null, null, null, null],
            [9, null, null, null, 4, null, null, 5, null],
            [4, null, null, null, 2, 9, 7, null, null],
            [null, 6, null, null, 7, 5, null, null, 3],
            [null, null, null, null, 3, null, null, null, 9],
            [null, null, null, null, null, null, 2, null, null],
            [null, null, null, null, null, 7, null, null, null],
            [null, null, 3, 4, null, null, 9, null, null],
            [2, 8, 5, null, null, null, null, null, null]
        ],
        [
            [null, null, null, null, null, null, 7, null, null],
            [null, 4, null, null, 5, null, 1, null, null],
            [6, 9, 2, null, null, null, null, 3, null],
            [null, null, 1, null, null, 9, null, null, null],
            [null, 5, null, null, null, 6, null, 8, null],
            [null, 2, null, 7, null, 4, null, 9, null],
            [7, null, 9, null, null, null, null, null, 3],
            [null, null, null, null, null, null, null, 7, null],
            [null, 8, null, null, 6, null, null, null, null]
        ],
        [
            [5, null, null, null, 1, null, 9, null, 4],
            [null, 9, null, 6, null, null, 7, null, null],
            [6, null, null, null, null, null, null, 1, null],
            [null, null, null, null, null, 3, 5, null, null],
            [2, null, null, null, null, null, null, null, 3],
            [null, 5, 9, 8, null, null, null, null, null],
            [null, null, null, null, null, null, 1, null, null],
            [null, 4, null, 3, null, 8, null, null, 6],
            [null, 3, null, 9, null, null, null, 4, null]
        ],
        [
            [null, 3, null, null, null, null, null, null, 4],
            [null, null, null, 6, null, null, 1, null, null],
            [4, null, null, null, 2, 7, null, null, null],
            [null, null, null, null, 4, null, null, 2, 5],
            [null, null, 7, null, null, null, null, null, null],
            [6, null, 8, null, null, 1, null, null, null],
            [null, null, null, null, 8, null, 7, null, null],
            [null, 1, null, null, null, null, null, 6, null],
            [null, null, 3, null, null, 5, null, null, 8]
        ],
        [
            [null, null, 3, 6, null, 2, null, 9, null],
            [null, null, null, 9, null, null, null, null, null],
            [null, null, 6, 1, 7, null, 2, null, null],
            [7, null, null, null, null, null, null, 8, null],
            [null, null, null, null, 8, 5, 3, null, null],
            [null, null, 9, null, null, null, null, null, null],
            [4, null, null, 7, null, 9, 1, null, null],
            [null, null, null, null, 4, null, null, null, 2],
            [null, null, null, null, null, 1, 7, 5, null]
        ],
        [
            [8, null, 4, 1, null, null, null, null, null],
            [null, null, 1, 9, 3, 2, null, null, 4],
            [null, null, null, null, null, null, 1, null, null],
            [1, 5, null, null, null, null, null, 7, null],
            [null, null, null, null, null, 7, null, 1, 6],
            [2, null, null, null, null, 5, null, null, null],
            [6, null, null, null, null, 1, null, 5, null],
            [null, null, null, 3, null, null, 2, null, null],
            [null, null, null, 4, null, null, null, null, 7]
        ],
        [
            [4, null, null, null, null, 1, 8, null, null],
            [null, null, null, null, 6, null, null, null, 5],
            [null, 5, 1, null, null, null, null, null, null],
            [9, null, 3, 8, 5, null, null, 2, null],
            [null, null, null, null, null, 7, null, 6, null],
            [null, null, null, null, null, null, null, null, 9],
            [6, 7, null, null, null, 3, null, 4, null],
            [null, null, null, 4, null, 8, 2, null, null],
            [null, 3, null, null, null, null, null, null, null]
        ]
    ];
    var medium = [
        [
            [null, null, null, null, null, null, null, null, null],
            [null, null, 8, null, 2, 6, null, null, null],
            [3, null, null, null, null, null, 1, 8, 9],
            [null, null, null, 9, 5, null, null, null, 3],
            [7, null, 9, null, null, null, null, null, null],
            [4, null, null, null, 6, 1, 5, null, null],
            [1, null, null, 3, null, null, 2, null, 5],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, 5, 8, null, null, null, null]
        ],
        [
            [null, null, 9, null, 5, null, 2, null, 7],
            [null, null, null, 1, null, null, null, null, null],
            [2, 1, null, null, 6, null, 4, null, 5],
            [1, 4, null, null, 7, null, null, null, null],
            [null, 6, 2, null, null, null, null, null, null],
            [null, null, null, 5, 2, 9, null, null, null],
            [null, null, null, 7, null, null, null, null, 8],
            [null, null, 1, null, null, null, null, 3, null],
            [5, 8, null, null, null, null, null, null, null]
        ],
        [
            [1, null, null, null, 7, null, null, 2, null],
            [null, null, 5, null, null, null, null, null, null],
            [null, 8, null, null, null, 3, 6, null, null],
            [6, 5, null, null, 3, 1, null, null, null],
            [null, null, null, 5, null, null, null, 6, null],
            [3, null, 9, null, 6, null, 7, null, 1],
            [5, null, 2, null, null, 4, null, null, null],
            [null, null, null, null, null, null, null, 9, null],
            [9, null, 4, null, null, null, 8, null, null]
        ],
        [
            [9, 5, null, 1, null, null, 2, null, null],
            [null, 7, null, 3, null, null, null, null, null],
            [null, null, null, null, null, 2, null, 6, 9],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, 5, null, null, null, null, null],
            [null, null, 4, null, 3, 9, null, null, 8],
            [7, null, 6, null, null, null, null, null, 3],
            [8, null, null, null, null, null, 1, 4, 6],
            [3, null, null, null, null, null, null, 9, 5]
        ],
        [
            [null, 4, null, null, 8, null, null, null, null],
            [null, null, null, null, 9, 1, 6, null, null],
            [null, null, null, null, null, null, 3, 5, null],
            [5, null, null, null, null, null, null, null, null],
            [null, null, 6, 3, null, 8, null, null, 1],
            [null, null, 7, 9, null, null, null, null, null],
            [7, 3, 9, 1, null, 4, null, 8, null],
            [2, 8, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, 1, 2, null]
        ],
        [
            [null, 8, null, 5, 4, null, null, null, null],
            [null, null, null, null, null, 6, null, 1, 3],
            [null, null, null, null, null, null, 8, 6, null],
            [null, 2, null, null, null, null, null, null, 7],
            [null, null, 4, null, null, null, 9, null, null],
            [9, 3, null, null, 6, null, null, null, null],
            [null, 6, null, 2, null, null, 7, null, null],
            [5, null, null, 3, null, null, 4, 2, null],
            [null, null, 7, null, 5, 1, null, null, null]
        ],
        [
            [null, null, null, null, null, null, null, null, null],
            [null, 8, null, 7, 9, 1, null, null, null],
            [1, null, null, null, null, null, 7, 5, null],
            [null, null, null, null, 3, null, null, null, null],
            [9, null, 7, 5, null, null, null, 4, 2],
            [5, null, 2, 9, 7, 4, null, null, null],
            [8, null, null, 1, null, null, null, null, null],
            [null, null, null, null, 2, null, null, null, 9],
            [null, null, 4, null, 5, 9, null, 2, null]
        ],
        [
            [null, null, null, null, null, null, null, null, null],
            [1, null, 5, null, null, null, 2, 8, null],
            [null, null, 6, null, 7, 8, null, null, null],
            [3, null, null, null, null, null, 7, null, null],
            [null, null, 8, 7, 1, 3, null, null, 4],
            [null, null, null, 8, null, null, null, null, null],
            [8, null, 3, null, null, null, null, 4, null],
            [2, null, null, 6, null, null, 5, 1, null],
            [null, null, null, null, null, 4, null, null, 7]
        ],
        [
            [6, 9, null, 1, null, null, null, null, null],
            [null, null, null, null, 3, null, null, 8, null],
            [3, null, null, 2, null, 9, null, null, null],
            [null, null, 8, null, 1, null, null, 3, null],
            [4, null, null, null, null, null, null, null, null],
            [5, null, null, null, null, 6, 8, null, null],
            [null, null, 2, 3, null, 8, 4, null, null],
            [null, null, 7, null, 9, 4, 2, null, null],
            [null, null, null, null, null, null, null, 5, null]
        ],
        [
            [null, null, null, null, 7, null, null, 1, null],
            [4, 6, null, null, 1, null, 3, null, null],
            [null, null, 5, 4, null, null, null, 7, null],
            [7, null, null, null, null, 3, 4, null, null],
            [null, null, null, null, null, null, null, null, 9],
            [6, null, 2, 9, null, null, null, null, 5],
            [null, 8, null, null, 2, null, 5, null, null],
            [null, null, null, null, null, null, null, 2, null],
            [null, 5, null, null, null, null, null, 9, 1]
        ]
    ];
    var hard = [
        [
            [null, null, null, null, null, 9, 5, null, null],
            [null, 4, null, null, null, 2, null, null, 8],
            [null, null, null, 1, null, 3, null, null, 9],
            [null, null, 6, null, null, 5, null, null, null],
            [null, null, 4, 9, null, null, null, null, null],
            [null, null, null, 2, 7, 6, null, 3, null],
            [5, 3, null, null, null, null, 1, null, null],
            [null, 1, null, null, null, null, null, 4, 5],
            [null, null, null, 6, null, null, 8, null, null]
        ],
        [
            [null, null, 3, 2, null, 9, 5, null, null],
            [8, null, null, null, 5, null, null, null, null],
            [null, null, null, null, null, null, null, null, 2],
            [null, 3, null, null, null, 8, null, null, null],
            [null, null, null, null, null, null, 6, 1, null],
            [null, 9, null, 1, null, null, null, null, 7],
            [null, null, null, null, null, 6, null, null, 9],
            [null, 6, 1, 3, null, null, null, 8, null],
            [null, 8, 5, 7, null, null, 3, null, null]
        ],
        [
            [5, null, null, null, null, null, null, null, null],
            [null, 3, null, 9, 6, null, null, 7, null],
            [2, null, null, null, null, 4, 8, null, null],
            [null, null, 5, null, null, null, null, 8, 1],
            [null, null, 9, null, 7, null, null, null, null],
            [1, 6, null, 5, null, null, null, null, 7],
            [3, 8, 7, null, 2, 5, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, 8, null, 6, null]
        ],
        [
            [2, null, null, null, 8, null, null, null, null],
            [null, 4, null, null, null, 9, 6, null, null],
            [null, null, 6, 2, null, null, null, null, null],
            [5, null, null, 1, null, null, null, 6, null],
            [6, null, null, null, null, null, 3, null, null],
            [1, null, 9, 7, null, 8, null, null, 2],
            [null, null, 8, null, null, null, 4, 3, null],
            [3, null, null, null, 7, null, null, null, null],
            [null, 1, null, 3, null, 5, null, null, null]
        ],
        [
            [3, null, null, null, null, 9, 1, null, 2],
            [null, 5, 8, null, null, null, 9, 7, null],
            [7, null, null, null, null, null, null, null, null],
            [null, null, null, null, 4, 3, null, null, null],
            [null, null, 3, 9, null, null, null, null, null],
            [9, null, null, 7, null, null, null, null, null],
            [null, 9, null, null, 6, null, 5, 1, 3],
            [null, null, 2, null, 8, null, 4, null, null],
            [null, null, 5, null, null, 4, 2, null, null]
        ],
        [
            [null, null, null, 1, 5, null, 8, 3, null],
            [null, null, 9, null, 7, 4, null, null, null],
            [null, null, null, null, null, null, null, null, 6],
            [null, 9, null, null, 4, 1, null, null, 2],
            [null, null, null, null, null, 3, 6, 5, null],
            [3, null, 2, null, null, null, null, null, 4],
            [null, 5, null, 9, null, null, null, 8, 3],
            [6, null, null, null, null, null, 4, null, null],
            [null, 2, null, null, null, null, null, null, null]
        ],
        [
            [null, null, 5, null, null, 4, 8, null, null],
            [null, 1, null, null, 9, 2, null, null, 3],
            [9, null, 2, null, null, null, null, 5, null],
            [null, 6, null, null, null, null, null, 3, 9],
            [null, null, 3, null, null, 1, 7, null, null],
            [null, null, null, null, null, null, null, null, null],
            [5, null, null, 4, null, null, null, 8, null],
            [6, null, null, null, 3, 5, null, null, null],
            [null, null, 9, 1, null, null, null, null, 7]
        ],
        [
            [8, null, null, 7, null, 5, 9, null, null],
            [7, null, 6, 2, null, null, null, null, null],
            [null, 9, null, null, null, null, null, 7, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, 6, null, 4, null, null, 3],
            [null, null, null, 5, 2, null, null, 1, 4],
            [null, null, null, null, 8, null, null, null, 1],
            [4, null, null, null, null, 1, null, 3, 6],
            [null, 3, 8, null, null, null, 2, null, null]
        ],
        [
            [null, null, null, null, 9, null, null, null, 4],
            [null, 4, null, 1, null, null, null, 6, null],
            [null, 2, 7, null, null, null, null, null, 5],
            [null, 9, null, null, null, null, null, null, null],
            [null, null, null, 8, null, 3, 6, null, null],
            [null, null, 6, null, null, 4, 1, 5, null],
            [null, 5, 2, null, null, null, null, 7, null],
            [null, null, null, 4, null, 8, null, null, null],
            [null, null, 3, null, null, 5, null, 4, null]
        ],
        [
            [null, null, null, null, null, null, 9, null, 2],
            [null, null, 3, null, null, null, null, 7, null],
            [null, null, 2, 4, 8, null, null, null, null],
            [null, 9, null, 2, null, 6, 5, null, 3],
            [null, null, null, null, null, 1, 4, null, 6],
            [8, null, null, 5, null, null, null, null, null],
            [null, 7, null, null, null, null, null, null, null],
            [null, 2, null, 9, 1, 8, null, null, null],
            [1, 6, null, null, 2, null, null, null, null]
        ]
    ];
    exports.getRandomVeryEasy = function () {
        var puzzle = [];
        veryEasy[Random.getRandomIntBetween(0, veryEasy.length)].forEach(function (row) {
            return puzzle.push(row.slice());
        });
        return puzzle;
    };
    exports.getRandomEasy = function () {
        var puzzle = [];
        easy[Random.getRandomIntBetween(0, easy.length)].forEach(function (row) {
            return puzzle.push(row.slice());
        });
        return puzzle;
    };
    exports.getRandomMedium = function () {
        var puzzle = [];
        medium[Random.getRandomIntBetween(0, medium.length)].forEach(function (row) {
            return puzzle.push(row.slice());
        });
        return puzzle;
    };
    exports.getRandomHard = function () {
        var puzzle = [];
        hard[Random.getRandomIntBetween(0, hard.length)].forEach(function (row) {
            return puzzle.push(row.slice());
        });
        return puzzle;
    };
    });

    var TableTransformer = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });

    exports.shuffleColumns = function (table) {
        // shuffling the rows of a transponsed table
        // is the same is shuffling the columns of a normal table
        table = _transponseTable(table);
        table = _shuffleRows(table);
        // transponsing it back
        table = _transponseTable(table);
        return table;
    };
    var _shuffleRows = function (table) {
        var first3xRows = [], second3xRows = [], third3xRows = [];
        table.forEach(function (row, i) {
            if (i < 3) {
                first3xRows.push(row.slice());
            }
            else if (i < 6) {
                second3xRows.push(row.slice());
            }
            else {
                third3xRows.push(row.slice());
            }
        });
        first3xRows = _shuffle1xRows(first3xRows);
        second3xRows = _shuffle1xRows(second3xRows);
        third3xRows = _shuffle1xRows(third3xRows);
        var available3xRows = [first3xRows, second3xRows, third3xRows];
        var firstPosition = available3xRows.splice(Random.getRandomIntBetween(0, available3xRows.length), 1)[0], secondPosition = available3xRows.splice(Random.getRandomIntBetween(0, available3xRows.length), 1)[0], thirdPosition = available3xRows[0];
        table = firstPosition.concat(secondPosition, thirdPosition);
        return table;
    };
    exports.shuffleRows = function (table) {
        return _shuffleRows(table);
    };
    var _shuffle1xRows = function (rows3x) {
        var firstRow = rows3x[0], secondRow = rows3x[1], thirdRow = rows3x[2];
        var availableRows = [firstRow, secondRow, thirdRow];
        var firstPosition = availableRows.splice(Random.getRandomIntBetween(0, availableRows.length), 1)[0], secondPosition = availableRows.splice(Random.getRandomIntBetween(0, availableRows.length), 1)[0], thirdPosition = availableRows[0];
        rows3x = [firstPosition, secondPosition, thirdPosition];
        return rows3x;
    };
    var _transponseTable = function (table) {
        var rows = [];
        table.forEach(function (row) { return rows.push(row.slice()); });
        for (var i = 0; i < 9; i++) {
            for (var j = 0; j < 9; j++) {
                // j and i in reversed order to change up rows and columns for transponding
                table[j][i] = rows[i][j];
            }
        }
        return table;
    };
    exports.transponseTable = function (table) {
        return _transponseTable(table);
    };
    var _rotateTable = function (table) {
        var rows = [];
        table.forEach(function (row) { return rows.push(row.slice()); });
        for (var i = 0; i < 9; i++) {
            for (var j = 0; j < 9; j++) {
                // j and i in reversed order to change up rows and columns for transponding
                table[j][i] = rows[i][-j + 8]; // -j + 8 because we need to fill from bottom to top when rotating
            }
        }
        return table;
    };
    exports.rotateTable = function (table, count) {
        // using modulo 4 because there is no point in rotating more than 4 times
        // since rotating 5 times results in the same as rotating only once (5 % 4 === 1)
        var rotateCount = count !== undefined && count !== null ? count % 4 : 1;
        for (var i = 0; i < rotateCount; i++) {
            table = _rotateTable(table);
        }
        return table;
    };
    var _horizontallyMirrorTable = function (table) {
        var rows = [];
        table.forEach(function (row) { return rows.push(row.slice()); });
        for (var i = 0; i < 4; i++) {
            table[i] = rows[8 - i];
            table[8 - i] = rows[i];
        }
        return table;
    };
    exports.horizontallyMirrorTable = function (table) {
        table = _horizontallyMirrorTable(table);
        return table;
    };
    exports.verticallyMirrorTable = function (table) {
        table = _transponseTable(table);
        table = _horizontallyMirrorTable(table);
        table = _transponseTable(table);
        return table;
    };
    exports.randomizeTableNumbers = function (table) {
        var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // mapping base number values to new random values
        var numberMap = {
            1: numbers.splice(Random.getRandomIntBetween(0, numbers.length), 1)[0],
            2: numbers.splice(Random.getRandomIntBetween(0, numbers.length), 1)[0],
            3: numbers.splice(Random.getRandomIntBetween(0, numbers.length), 1)[0],
            4: numbers.splice(Random.getRandomIntBetween(0, numbers.length), 1)[0],
            5: numbers.splice(Random.getRandomIntBetween(0, numbers.length), 1)[0],
            6: numbers.splice(Random.getRandomIntBetween(0, numbers.length), 1)[0],
            7: numbers.splice(Random.getRandomIntBetween(0, numbers.length), 1)[0],
            8: numbers.splice(Random.getRandomIntBetween(0, numbers.length), 1)[0],
            9: numbers[0]
        };
        table.forEach(function (row, i) {
            row.forEach(function (num, j) {
                if (num) {
                    table[i][j] = numberMap[num];
                }
            });
        });
        return table;
    };
    });

    var FakeSudokuPuzzleGenerator = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });

    // utils = require("./Utils");


    var _transformBaseSudokuPuzzle = function (puzzle) {
        puzzle = TableTransformer.shuffleColumns(puzzle);
        puzzle = TableTransformer.shuffleRows(puzzle);
        puzzle = TableTransformer.rotateTable(puzzle, Random.getRandomIntBetween(0, 4));
        if (Random.getRandomIntBetween(0, 2)) {
            puzzle = TableTransformer.transponseTable(puzzle);
        }
        if (Random.getRandomIntBetween(0, 2)) {
            puzzle = TableTransformer.horizontallyMirrorTable(puzzle);
        }
        if (Random.getRandomIntBetween(0, 2)) {
            puzzle = TableTransformer.verticallyMirrorTable(puzzle);
        }
        puzzle = TableTransformer.randomizeTableNumbers(puzzle);
        return puzzle;
    };
    /**
     * @Method: Returns a very easy puzzle.
     * @Param none
     * @Return {(number | null)[][];}
     */
    exports.getVeryEasySudoku = function () {
        var puzzle = BasePuzzles.getRandomVeryEasy();
        puzzle = _transformBaseSudokuPuzzle(puzzle);
        return puzzle;
    };
    /**
     * @Method: Returns an easy puzzle.
     * @Param none
     * @Return {(number | null)[][];}
     */
    exports.getEasySudoku = function () {
        var puzzle = BasePuzzles.getRandomEasy();
        puzzle = _transformBaseSudokuPuzzle(puzzle);
        return puzzle;
    };
    /**
     * @Method: Returns a medium puzzle.
     * @Param none
     * @Return {(number | null)[][];}
     */
    exports.getMediumSudoku = function () {
        var puzzle = BasePuzzles.getRandomMedium();
        puzzle = _transformBaseSudokuPuzzle(puzzle);
        return puzzle;
    };
    /**
     * @Method: Returns a hard puzzle.
     * @Param none
     * @Return {(number | null)[][];}
     */
    exports.getHardSudoku = function () {
        var puzzle = BasePuzzles.getRandomHard();
        puzzle = _transformBaseSudokuPuzzle(puzzle);
        return puzzle;
    };
    /**
     * @Method: Returns a puzzle with the required difficulty.
     * @Param String of either one of the following values:
     *        "VeryEasy" || "Easy" || "Medium" || "Hard".
     * Case does not matter. If the value is omitted or does not match any, a VeryEasy puzzle will be returned.
     * @Return {(number | null)[][];}
     */
    exports.getSudoku = function (difficulty) {
        switch (difficulty + "".toLowerCase()) {
            case "veryeasy":
                return exports.getVeryEasySudoku();
            case "easy":
                return exports.getEasySudoku();
            case "medium":
                return exports.getMediumSudoku();
            case "hard":
                return exports.getHardSudoku();
            default:
                return exports.getVeryEasySudoku();
        }
    };
    });

    /**
     * @param {('veryeasy' | 'easy' | 'medium' | 'hard')} difficulty
     * @returns {number[][]}
     */
    function generateSudoku(difficulty = 'easy') {
    	const sudoku = FakeSudokuPuzzleGenerator.getSudoku(difficulty);

    	for (let row = 0; row < SUDOKU_SIZE; row++) {
    		for (let col = 0; col < SUDOKU_SIZE; col++) {
    			if (sudoku[row][col] === null) sudoku[row][col] = 0;
    		}
    	}

    	return sudoku;
    }


    /**
     * @param {number[][]} sudoku
     */
    function solveSudoku(sudoku) {
    	let grid = [
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    		[0, 0, 0, 0, 0, 0, 0, 0, 0],
    	];

    	const solution = sudokuSolver(sudoku.flat().join(''), {
    		outputArray: true,
    		hintCheck: false
    	});

    	for (let cell = 0; cell < GRID_LENGTH; cell++) {
    		const [row, col] = GRID_COORDS[cell];
    		grid[row][col] = solution[cell];
    	}

    	return grid;
    }

    function createSettings() {
    	const settings = writable((() => {
    		const storedSettings = localStorage.getItem('settings');

    		if (storedSettings) {
    			return JSON.parse(storedSettings);
    		}

    		return DEFAULT_SETTINGS;
    	})());

    	return {
    		subscribe: settings.subscribe,

    		set(newSettings) {
    			settings.set(newSettings);
    			localStorage.setItem('settings', JSON.stringify(newSettings));
    		},
    	};
    }

    const settings = createSettings();

    const usedHints = writable(0);

    function createHints() {
    	let defaultHints = Infinity;

    	const hints = writable(Infinity);

    	settings.subscribe(($settings) => {
    		if ($settings.hintsLimited) {
    			defaultHints = $settings.hints;
    			hints.update($hints => {
    				if ($hints > $settings.hints) return $settings.hints;

    				return $hints;
    			});
    		} else {
    			defaultHints = Infinity;
    			hints.set(Infinity);
    		}
    	});

    	return {
    		subscribe: hints.subscribe,

    		useHint() {
    			hints.update($hints => {
    				if ($hints > 0) {
    					usedHints.update($usedHints => $usedHints + 1);
    					return $hints - 1;
    				}

    				return 0;
    			});
    		},

    		reset() {
    			hints.set(defaultHints);
    			usedHints.set(0);
    		}
    	};
    }

    const hints = createHints();

    /**
     *  Create a new current time step cell.
     * @param before {{candidates, timeStep, before, strategies, relativePos, available}|null}
     * @param timeStep {number}
     * @param available {boolean}
     * @param candidates {Number[]}
     * @param strategies {{description}[]}
     * @param relativePos {{x, y}[]}
     * @param explore {Number}
     * @returns {{candidates, timeStep, before, strategies, relativePos, available}}
     * @constructor
     */
    function CreateCurrentTimeStepCell(
        before, timeStep, available, candidates = null, strategies = null,
        relativePos = null, explore = 0) {
      return {
        before: before,
        timeStep: timeStep,
        available: available,
        strategies: strategies === null ? [] : [...strategies],
        candidates: candidates === null ? [] : [...candidates],
        relativePos: relativePos === null ? [] : [...relativePos],
        explore: explore,
      };
    }


    /**
     *
     * @param pos {{x, y}}
     * @param grid {Number[][]}
     */
    function CreateCellLinkedList(pos, grid) {
      // Calculate the candidate value
      this.currentPos = {...pos};
      this.isConstant = grid[this.currentPos.y][this.currentPos.x] !== 0;
      this.candidates = [];
      this.strategies = [];
      this.current = null;
      this.relativePos = [];
      this.explore = 0;

      /**
       * Return available of the grid.
       */
      this.isCellConstant = function() {
        return this.isConstant || this.explore !== 0;
      };

      this.isUserCell = function() {
        return !this.isConstant;
      };

      this.getInitialCandidate = function(row, col){
        let candidates = Array.from({length: SUDOKU_SIZE}, (_, i) => i + 1);
        const sameRow = grid[row];
        const sameCol = grid.map(row => row[col]);

        // Same box
        const boxStartRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
        const boxStartCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
        const sameBox = [];
        for (let r = boxStartRow; r < boxStartRow + BOX_SIZE; r++) {
          for (let c = boxStartCol; c < boxStartCol + BOX_SIZE; c++) {
            sameBox.push(grid[r][c]);
          }
        }

        const excludeValue = new Set([...sameRow, ...sameCol, ...sameBox]);
        candidates = candidates.filter(candidate => !excludeValue.has(candidate));
        return candidates;
      };

      if (!this.isConstant) {
        this.candidates = this.getInitialCandidate(this.currentPos.y, this.currentPos.x);
        this.current = CreateCurrentTimeStepCell(null, 0, true,
            this.candidates);
      }

      /**
       *
       * @returns {Number|*}
       */
      this.getCurrentCell = function() {
        if (this.isConstant) return grid[this.currentPos.y][this.currentPos.x];

        if (this.explore !== 0) return this.explore;

        return this.current;
      };

      /**
       * Return strategy at current time step
       * @returns {any}
       */
      this.getStrategies = function() {
        return this.strategies;
      };

      this.resetStrategies = function() {
        this.strategies = [];
      };

      /**
       * Return relative position at current time step
       * @returns {any}
       */
      this.getRelativePos = function() {
        return this.relativePos;
      };

      this.resetRelativePos = function() {
        this.relativePos = [];
      };


      /**
       * Validate if the input number is valid
       *@param num {Number}
       */
      this.validate = function(num) {
        return this.candidates.some(candidate => candidate === num);
      };

      /**
       * Add a new state when strategies work/ decision make
       * @param newTimeStep
       * @param strategies
       */
      this.add = function(newTimeStep) {
        this.timeStep = newTimeStep;
        this.current = CreateCurrentTimeStepCell(this.current, this.timeStep,
            this.candidates.length !== 1, this.candidates, this.strategies,
            this.relativePos, this.explore);
      };

      /**
       * Return to the branch point
       * @param specificTimeStep
       */
      this.branchBack = function(specificTimeStep) {
        if (specificTimeStep < 0) {
          throw new Error('time step must bigger than zero');
        }

        if (this.isConstant) {
          return;
        }

        while (this.current.timeStep > specificTimeStep) {
          if (this.current.before === null) {
            throw new Error(`time step ${specificTimeStep} less than the value`);
          }
          this.current = this.current.before;
        }

        // Judge if strategy used in this time step
        this.strategies = this.current.timeStep === specificTimeStep ? [...this.current.strategies] : [];
        this.relativePos = this.current.timeStep === specificTimeStep ?[...this.current.relativePos] : [];
        this.explore = this.current.explore;
      };
    }

    function createGrid() {
      const grid = writable([
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ]);

      return {
        subscribe: grid.subscribe,

        generate(difficulty) {
          grid.set(generateSudoku(difficulty));
        },

        decodeSencode(sencode) {
          grid.set(decodeSencode(sencode));
        },

        get(gridStore, x, y) {
          return gridStore[y][x];
        },

        getSencode(gridStore) {
          return encodeSudoku(gridStore);
        },
      };
    }

    const grid = createGrid();


    function createUserGrid() {
      const userGrid = writable([
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ]);

      grid.subscribe($grid => {
        let newGrid = [];

        for (let y = 0; y < SUDOKU_SIZE; y++) {
          newGrid[y] = [];
          for (let x = 0; x < SUDOKU_SIZE; x++) {
            newGrid[y][x] = $grid[y][x];
          }
        }

        userGrid.set(newGrid);
      });

      return {
        subscribe: userGrid.subscribe,

        set: (pos, value) => {
          userGrid.update($userGrid => {
            $userGrid[pos.y][pos.x] = value;
            return $userGrid;
          });
        },

        applyHint: (pos) => {
          hints.useHint();
          userGrid.update($userGrid => {
            const solvedSudoku = solveSudoku($userGrid);
            $userGrid[pos.y][pos.x] = solvedSudoku[pos.y][pos.x];
            return $userGrid;
          });
        },
      };
    }

    const userGrid = createUserGrid();

    const invalidCells = derived(userGrid, $userGrid => {
      const _invalidCells = [];

      const addInvalid = (x, y) => {
        const xy = x + ',' + y;
        if (!_invalidCells.includes(xy)) _invalidCells.push(xy);
      };

      for (let y = 0; y < SUDOKU_SIZE; y++) {
        for (let x = 0; x < SUDOKU_SIZE; x++) {

          const value = $userGrid[y][x];

          if (value) {
            for (let i = 0; i < SUDOKU_SIZE; i++) {
              // Check the row
              if (i !== x && $userGrid[y][i] === value) {
                addInvalid(x, y);
              }

              // Check the column
              if (i !== y && $userGrid[i][x] === value) {
                addInvalid(x, i);
              }
            }

            // Check the box
            const startY = Math.floor(y / BOX_SIZE) * BOX_SIZE;
            const endY = startY + BOX_SIZE;
            const startX = Math.floor(x / BOX_SIZE) * BOX_SIZE;
            const endX = startX + BOX_SIZE;
            for (let row = startY; row < endY; row++) {
              for (let col = startX; col < endX; col++) {
                if (row !== y && col !== x && $userGrid[row][col] === value) {
                  addInvalid(col, row);
                }
              }
            }
          }

        }
      }

      return _invalidCells;
    }, []);

    /**
     *
     * @returns {{subscribe: (this:void, run: Subscriber<*[]>, invalidate?: Invalidator<*[]>) => Unsubscriber}}
     */
    function createStrategyGrid() {
      const strategyGrid = writable([]);
      let timeStep = writable(0);

      grid.subscribe($grid => {
        strategyGrid.set(Array.from({length: SUDOKU_SIZE},
            (_, y) => Array.from({length: SUDOKU_SIZE},
                (_, x) => new CreateCellLinkedList({x, y}, $grid))));
      });

      return {
        subscribe: strategyGrid.subscribe,

        set: (pos, value) => {
          strategyGrid.update($strategyGrid => {
            $strategyGrid[pos.y][pos.x].explore = value;
            $strategyGrid[pos.y][pos.x].strategy = [];
            $strategyGrid[pos.y][pos.x].relativePos = [];
            $strategyGrid[pos.y][pos.x].add(get_store_value(timeStep));
            return $strategyGrid;
          });
        },

        setCurrentCell: (pos) => {
          strategyGrid.update($strategyGrid => {
            $strategyGrid[pos.y][pos.x].add(get_store_value(timeStep));
            return $strategyGrid;
          });
        },

        increaseTimeStep: ()=> timeStep.update($timeStep => { $timeStep++; return $timeStep;}),

        /**
         * Getter and Setter method
         */
        setTimeStep: (specificTimeStep) => timeStep.set(specificTimeStep),
        getTimeStep: () => timeStep,

        getStrategyGrid: () => strategyGrid,

        updateCellCandidates: () => {
          strategyGrid.update($strategyGrid => {
            for (let row = 0; row < SUDOKU_SIZE; row++) {
              for (let col = 0; col < SUDOKU_SIZE; col++) {
                if ($strategyGrid[row][col].isCellConstant()) continue;

                let candidates = Array.from({length: SUDOKU_SIZE}, (_, i) => i + 1);
                const sameRow = $strategyGrid[row]
                  .filter((cell, index) => index !== col)
                  .map(cell => cell.isCellConstant() ? cell.getCurrentCell() : 0)
                  .flat();
                const sameCol = $strategyGrid
                .filter((cellRow, index) => index !== row)
                .map(cellRow => cellRow[col].isCellConstant() ? cellRow[col].getCurrentCell() : 0)
                .flat();

                // Same box
                const boxStartRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
                const boxStartCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
                const sameBox = [];
                for (let r = boxStartRow; r < boxStartRow + BOX_SIZE; r++) {
                  for (let c = boxStartCol; c < boxStartCol + BOX_SIZE; c++) {
                    if ($strategyGrid[r][c].isCellConstant()) sameBox.push($strategyGrid[r][c].getCurrentCell());
                  }
                }

                const excludeValue = new Set([...sameRow, ...sameCol, ...sameBox]);
                candidates = candidates.filter(candidate => !excludeValue.has(candidate));
                $strategyGrid[row][col].candidates = candidates;
              }
            }

            return $strategyGrid;
          });
        },
      }
    }

    const strategyGrid = createStrategyGrid();

    const gamePaused = writable(true);

    const gameWon = derived(
    	strategyGrid, $strategyGrid => {
    		for (let row = 0; row < SUDOKU_SIZE; row++) {
    			for (let col = 0; col < SUDOKU_SIZE; col++) {
    				if ($strategyGrid[row][col].isUserCell() && $strategyGrid[row][col].explore === 0) {
    					return false;
    				}
    			}
    		}
    		// No empty fields...
    		return true;
    	},
    	false,
    );

    function createTimer() {
    	let timerInterval = null;
    	let timeBegan = null;
    	let timeStopped = null;
    	let stoppedDuration = 0;
    	let running = false;

    	const timer = writable('00:00');

    	// The timer uses a writable store but only returns a subscribe function so it's read-only
    	return {
    		subscribe: timer.subscribe,

    		start() {
    			if (running) return;

    			if (timeBegan === null) {
    				this.reset();
    				timeBegan = Date.now();
    			}

    			if (timeStopped !== null) {
    				stoppedDuration += (Date.now() - timeStopped);
    			}

    			timerInterval = setInterval(() => {
    				const time = Date.now() - timeBegan - stoppedDuration;
    				const timeStr = new Date(time).toISOString().substr(11, 8);

    				if (timeStr.substr(0, 2) === '00') {
    					timer.set(timeStr.substr(3));
    					return;
    				}

    				timer.set(timeStr);
    			}, 10);
    			running = true;
    		},

    		stop() {
    			running = false;
    			timeStopped = Date.now();
    			clearInterval(timerInterval);
    		},

    		reset() {
    			running = false;
    			clearInterval(timerInterval);
    			stoppedDuration = 0;
    			timeBegan = null;
    			timeStopped = null;
    			timer.set('00:00');
    		},
    	};
    }

    const timer = createTimer();

    /**
     * Start new game with a generated sudoku
     *
     * @param {('veryeasy' | 'easy' | 'medium' | 'hard')} diff - Difficulty
     */
    function startNew(diff) {
    	difficulty.set(diff);
    	grid.generate(diff);
    	cursor.reset();
    	timer.reset();
    	hints.reset();

    	location.hash = '';
    }

    /**
     * Start new game with a custom sudoku
     *
     * @param {string} sencode - Sencode to decode
     */
    function startCustom(sencode) {
    	difficulty.setCustom();
    	grid.decodeSencode(sencode);
    	cursor.reset();
    	timer.reset();
    	hints.reset();
    }

    /**
     * Pause the game
     */
    function pauseGame() {
    	timer.stop();
    	gamePaused.set(true);
    }

    /**
     * Resume (un-pause) the game
     */
    function resumeGame() {
    	timer.start();
    	gamePaused.set(false);
    }

    var game = {
    	startNew,
    	startCustom,
    	pause: pauseGame,
    	resume: resumeGame
    };

    const modalData = writable({});

    function createModal() {
    	const modalType = writable(MODAL_NONE);

    	let onHide = false;
    	let onHideReplace = false;

    	return {
    		subscribe: modalType.subscribe,

    		show(type, data = {}) {
    			modalType.set(type);
    			modalData.set(data);

    			onHide = data.onHide || false;
    			onHideReplace = data.onHideReplace || false;
    		},

    		hide() {
    			if (onHideReplace && onHide) {
    				onHide();
    			} else {
    				modalType.set(MODAL_NONE);

    				if (onHide) {
    					setTimeout(onHide, MODAL_DURATION);
    				}
    			}
    		},
    	};
    }

    const modal = createModal();

    class BaseStrategy {
      preCondition(grid) {
        throw new Error("Base strategy is just an interface.");
      }

      apply(grid, strategyApplyCell) {
        throw new Error("Base strategy is just an interface.");
      }

      strategyDescription() {
        throw new Error("Base strategy is just an interface.");
      }
    }

    class HiddenSingleStrategy extends BaseStrategy {
      constructor(description = "Hidden Single", priority = 1) {
        super();
        this.description = description;
        this.priority = priority;
        this.fullSetCandidates = Array.from({length: SUDOKU_SIZE}).map((_, i) => i + 1);
      }

      isSameBox(pos1, pos2) {
        return Math.floor(pos1.y / BOX_SIZE) === Math.floor(pos2.y / BOX_SIZE)
            && Math.floor(pos1.x / BOX_SIZE) === Math.floor(pos2.x / BOX_SIZE);
      }

      preCondition(grid) {
        for (let row = 0; row < SUDOKU_SIZE; row++) {
          for (let col = 0; col < SUDOKU_SIZE; col++) {
            if (grid[row][col].isCellConstant() || grid[row][col].candidates.length === 1) continue;
            // Same row filter
            let sameRowOtherCellCandidatesArray = grid[row]
                .filter((cell, index) => !cell.isCellConstant() && index !== col)
                .map(cell => cell.candidates)
                .flat();
            let sameRowOtherCellCandidatesSet = new Set(sameRowOtherCellCandidatesArray);

            let leftSameRowCandidates = grid[row][col].candidates.filter(candidate => !sameRowOtherCellCandidatesSet.has(candidate));
            if (leftSameRowCandidates.length === 1) {
              return true;
            }

            // Same col filter
            let sameColOtherCellCandidatesArray = grid
                .filter((cellRow, index) => !cellRow[col].isCellConstant() && index !== row)
                .map(cellRow => cellRow[col].candidates)
                .flat();
            let sameColOtherCellCandidatesSet = new Set(sameColOtherCellCandidatesArray);

            let leftSameColCandidates = grid[row][col].candidates.filter(candidate => !sameColOtherCellCandidatesSet.has(candidate));
            if (leftSameColCandidates.length === 1) {
              return true;
            }

            // Same box filter
            let sameBoxOtherCellCandidatesSet = new Set();
            let startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
            let startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
            for (let i = startRow; i < startRow + BOX_SIZE; i++) {
              for (let j = startCol; j < startCol + BOX_SIZE; j++) {
                if (!(i === row && j === col)  && !grid[i][j].isCellConstant()) {
                  for (const candidate of grid[i][j].candidates) {
                    sameBoxOtherCellCandidatesSet.add(candidate);
                  }
                }
              }
            }
            let leftSameBoxCandidates = grid[row][col].candidates.filter(candidate => !sameBoxOtherCellCandidatesSet.has(candidate));
            if (leftSameBoxCandidates.length === 1) {
              return true;
            }
          }
        }


        return false;
      }

      apply(grid, strategyApplyCell) {
        for (let row = 0; row < SUDOKU_SIZE; row++) {
          for (let col = 0; col < SUDOKU_SIZE; col++) {
            if (grid[row][col].isCellConstant() || grid[row][col].candidates.length === 1) continue;

            // Same row filter
            let sameRowOtherCellCandidatesArray = grid[row]
                .filter((cell, index) => !cell.isCellConstant() && index !== col)
                .map(cell => cell.candidates)
                .flat();
            let sameRowOtherCellCandidatesSet = new Set(sameRowOtherCellCandidatesArray);

            let leftSameRowCandidates = grid[row][col].candidates.filter(candidate => !sameRowOtherCellCandidatesSet.has(candidate));
            if (leftSameRowCandidates.length === 1) {
              grid[row][col].candidates = leftSameRowCandidates;
              for (let r = 0; r < SUDOKU_SIZE; r++) {
                for (let c = 0; c < SUDOKU_SIZE; c++) {
                  if (c === col) continue;
                  if ((grid[r][c].isCellConstant() && grid[r][c].getCurrentCell() === leftSameRowCandidates[0])
                      || (!grid[r][c].isCellConstant() && grid[r][c].candidates.length === 1 && grid[r][c].candidates[0] === leftSameRowCandidates[0])
                  ) {
                    for (const strategy of grid[row][c].strategies) {
                      if (!grid[row][col].strategies.includes(strategy)) {
                        grid[row][col].strategies.push(strategy);
                      }
                    }
                    grid[row][col].relativePos.push({x: c, y: r});
                  }
                }
              }

              for (let c = 0; c < SUDOKU_SIZE; c++) {
                if (c === col) continue;
                if (!grid[row][c].isCellConstant() && grid[row][c].strategies.length > 0
                    && !grid[row][col].relativePos.some(cell => cell.x === c || this.isSameBox(cell, {x: c, y: row}))) {
                  for (const strategy of grid[row][c].strategies) {
                    if (!grid[row][col].strategies.includes(strategy)) {
                      grid[row][col].strategies.push(strategy);
                    }
                  }
                  grid[row][col].relativePos.push({x: c, y: row});
                }
              }

              grid[row][col].strategies.push(this);


              strategyApplyCell.push({x: col, y: row});
              continue;
            }

            // Same col filter
            let sameColOtherCellCandidatesArray = grid
                .filter((cellRow, index) => !cellRow[col].isCellConstant() && index !== row)
                .map(cellRow => cellRow[col].candidates)
                .flat();
            let sameColOtherCellCandidatesSet = new Set(sameColOtherCellCandidatesArray);

            let leftSameColCandidates = grid[row][col].candidates.filter(candidate => !sameColOtherCellCandidatesSet.has(candidate));
            if (leftSameColCandidates.length === 1) {
              grid[row][col].candidates = leftSameColCandidates;
              grid[row][col].strategies.push(this);
              for (let r = 0; r < SUDOKU_SIZE; r++) {
                for (let c = 0; c < SUDOKU_SIZE; c++) {
                  if (r === row) continue;
                  if ((grid[r][c].isCellConstant() && grid[r][c].getCurrentCell() === leftSameColCandidates[0])
                      || (!grid[r][c].isCellConstant() && grid[r][c].candidates.length === 1 && grid[r][c].candidates[0] === leftSameColCandidates[0])) {
                    for (const strategy of grid[row][c].strategies) {
                      if (!grid[row][col].strategies.includes(strategy)) {
                        grid[row][col].strategies.push(strategy);
                      }
                    }
                    grid[row][col].relativePos.push({x: c, y: r});
                  }
                }
              }

              for (let r = 0; r < SUDOKU_SIZE; r++) {
                if (r === row) continue;
                if (!grid[r][col].isCellConstant() && grid[r][col].strategies.length > 0
                    && !grid[row][col].relativePos.some(cell => cell.y === r || this.isSameBox(cell, {x: r, y: col}))) {
                  for (const strategy of grid[r][col].strategies) {
                    if (!grid[row][col].strategies.includes(strategy)) {
                      grid[row][col].strategies.push(strategy);
                    }
                  }
                  grid[row][col].relativePos.push({x: col, y: r});
                }
              }

              grid[row][col].strategies.push(this);

              strategyApplyCell.push({x: col, y: row});
              continue;
            }

            // Same box filter
            let sameBoxOtherCellCandidatesSet = new Set();
            let startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
            let startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
            for (let i = startRow; i < startRow + BOX_SIZE; i++) {
              for (let j = startCol; j < startCol + BOX_SIZE; j++) {
                if (!(i === row && j === col)  && !grid[i][j].isCellConstant()) {
                  for (const candidate of grid[i][j].candidates) {
                    sameBoxOtherCellCandidatesSet.add(candidate);
                  }
                }
              }
            }

            let leftSameBoxCandidates = grid[row][col].candidates.filter(candidate => !sameBoxOtherCellCandidatesSet.has(candidate));
            if (leftSameBoxCandidates.length === 1) {
              grid[row][col].candidates = leftSameBoxCandidates;
              let startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
              let startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
              for (let i = startRow; i < startRow + BOX_SIZE; i++) {
                for (let j = 0; j < SUDOKU_SIZE; j++) {
                  if (i === row || j === col)  continue;
                  if ((grid[i][j].isCellConstant() && grid[i][j].getCurrentCell() === leftSameBoxCandidates[0])
                      ||(!grid[i][j].isCellConstant() &&  grid[i][j].candidates.length === 1 && grid[i][j].candidates[0] === leftSameBoxCandidates[0])) {
                    if (grid[i][j].strategies.length > 0) {
                      for (const strategy of grid[i][j].strategies) {
                        if (!grid[row][col].strategies.includes(strategy)) {
                          grid[row][col].strategies.push(strategy);
                        }
                      }
                    }
                    grid[row][col].relativePos.push({x: j, y: i});
                  }
                }
              }

              for (let i = 0; i < SUDOKU_SIZE; i++) {
                for (let j = startCol; j < startCol + BOX_SIZE; j++) {
                  if (i === row || j === col)  continue;
                  if ((grid[i][j].isCellConstant() && grid[i][j].getCurrentCell() === leftSameBoxCandidates[0])
                      ||(!grid[i][j].isCellConstant() &&  grid[i][j].candidates.length === 1&& grid[i][j].candidates[0] === leftSameBoxCandidates[0])) {
                    if (grid[i][j].strategies.length > 0) {
                      for (const strategy of grid[i][j].strategies) {
                        if (!grid[row][col].strategies.includes(strategy)) {
                          grid[row][col].strategies.push(strategy);
                        }
                      }
                    }
                    grid[row][col].relativePos.push({x: j, y: i});
                  }
                }
              }


              grid[row][col].strategies.push(this);

              strategyApplyCell.push({x: col, y: row});
            }
          }
        }
      }

      strategyDescription() {
        return this.description;
      }
    }

    const hs = new HiddenSingleStrategy();

    class NakedPairsStrategy extends BaseStrategy {
        constructor(description = "Naked Pairs", priority = 2) {
            super();
            this.description = description;
            this.priority = priority;
        }

        preCondition(grid) {
            // 检查行
            for (let row = 0; row < SUDOKU_SIZE; row++) {
                if (this.checkUnitForNakedPairs(grid[row])) {
                    return true;
                }
            }

            // 检查列
            for (let col = 0; col < SUDOKU_SIZE; col++) {
                const colArray = grid.map(row => row[col]);
                if (this.checkUnitForNakedPairs(colArray)) {
                    return true;
                }
            }

            // 检查宫
            for (let box = 0; box < SUDOKU_SIZE; box++) {
                const boxRow = Math.floor(box / BOX_SIZE) * BOX_SIZE;
                const boxCol = (box % BOX_SIZE) * BOX_SIZE;
                const boxArray = [];

                for (let i = 0; i < BOX_SIZE; i++) {
                    for (let j = 0; j < BOX_SIZE; j++) {
                        boxArray.push(grid[boxRow + i][boxCol + j]);
                    }
                }

                if (this.checkUnitForNakedPairs(boxArray)) {
                    return true;
                }
            }
            return false;
        }

        checkUnitForNakedPairs(unit) {
            for (let i = 0; i < unit.length - 1; i++) {
                if (unit[i].isCellConstant() || unit[i].candidates.length !== 2) {
                    continue;
                }

                for (let j = i + 1; j < unit.length; j++) {
                    if (unit[j].isCellConstant() || unit[j].candidates.length !== 2) continue;

                    const candidates = unit[i].candidates;
                    if (this.arraysEqual(unit[i].candidates, unit[j].candidates)) {
                        for (let k = 0; k < unit.length; k++) {
                            // 如果k不等于i和j且k的candidates和i的candidates有交集
                            if (k !== i && k !== j && !unit[k].isCellConstant() && unit[k].candidates.some(n => candidates.includes(n))) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }

        apply(grid, strategyApplyCell) {
            // 应用到行
            for (let row = 0; row < SUDOKU_SIZE; row++) {
                this.applyToUnit(grid[row], row, true, grid, strategyApplyCell);
            }

            // 应用到列
            for (let col = 0; col < SUDOKU_SIZE; col++) {
                const colArray = grid.map(row => row[col]);
                this.applyToUnit(colArray, col, false, grid, strategyApplyCell);
            }

            // 应用到宫
            for (let box = 0; box < SUDOKU_SIZE; box++) {
                const boxRow = Math.floor(box / BOX_SIZE) * BOX_SIZE;
                const boxCol = (box % BOX_SIZE) * BOX_SIZE;
                const boxArray = [];

                for (let i = 0; i < BOX_SIZE; i++) {
                    for (let j = 0; j < BOX_SIZE; j++) {
                        boxArray.push({
                            cell: grid[boxRow + i][boxCol + j],
                            row: boxRow + i,
                            col: boxCol + j
                        });
                    }
                }

                this.applyToBox(boxArray, grid, strategyApplyCell);
            }
        }

        applyToUnit(unit, index, isRow, grid, strategyApplyCell) {
            for (let i = 0; i < unit.length - 1; i++) {
                if (unit[i].isCellConstant() || unit[i].candidates.length !== 2) continue;

                for (let j = i + 1; j < unit.length; j++) {
                    if (unit[j].isCellConstant() || unit[j].candidates.length !== 2) continue;

                    if (this.arraysEqual(unit[i].candidates, unit[j].candidates)) {
                        const candidates = unit[i].candidates;
                        // // 把位置和候选数打印出来
                        // console.log('location: ', isRow ? {x: i, y: index} : {x: index, y: i});
                        // console.log('index: ', index);
                        // console.log('i, j: ', i, j);
                        // console.log('unit[i].candidates: ', unit[i].candidates);
                        // console.log('unit[j].candidates: ', unit[j].candidates);

                        // 从其他单元格移除这些候选数
                        for (let k = 0; k < unit.length; k++) {
                            if (k !== i && k !== j && !unit[k].isCellConstant()) {
                                const originalLength = unit[k].candidates.length;
                                // 只看location: {x: 8, y: 4}且candidates.length === 2的单元格
                                // if (isRow ? (k === 8 && index === 0) : (index === 8 && k === 0)) {
                                //     console.log('location: ', isRow ? {x: k, y: index} : {x: index, y: k});
                                //     console.log('unit[k].candidates: ', unit[k].candidates);
                                //     debugger;
                                // }
                                unit[k].candidates = unit[k].candidates.filter(n => !candidates.includes(n));
                                // if (isRow ? (k === 8 && index === 0) : (index === 8 && k === 0)) {
                                //     console.log('unit[k].candidates: ', unit[k].candidates);
                                //     debugger;
                                // }

                                if (originalLength !== unit[k].candidates.length) {
                                    const pos = isRow ? {x: k, y: index} : {x: index, y: k};
                                    // // 只有当unit[k].candidates.length === 1时才添加到strategyApplyCell
                                    // if (unit[k].candidates.length === 1) {
                                    //     strategyApplyCell.push(pos);
                                    // }
                                    strategyApplyCell.push(pos);
                                    unit[k].strategies.push(this);

                                    // 添加相关的位置
                                    unit[k].relativePos.push(isRow ? {x: i, y: index} : {x: index, y: i});
                                    unit[k].relativePos.push(isRow ? {x: j, y: index} : {x: index, y: j});
                                }
                            }
                        }
                    }
                }
            }
        }

        applyToBox(boxArray, grid, strategyApplyCell) {
            for (let i = 0; i < boxArray.length - 1; i++) {
                if (boxArray[i].cell.isCellConstant() || boxArray[i].cell.candidates.length !== 2) continue;

                for (let j = i + 1; j < boxArray.length; j++) {
                    if (boxArray[j].cell.isCellConstant() || boxArray[j].cell.candidates.length !== 2) continue;

                    if (this.arraysEqual(boxArray[i].cell.candidates, boxArray[j].cell.candidates)) {
                        const candidates = boxArray[i].cell.candidates;
                        // // 把位置和候选数打印出来
                        // console.log('location: ', {x: boxArray[i].col, y: boxArray[i].row});
                        // console.log('i, j: ', i, j);
                        // console.log('boxArray[i].cell.candidates: ', boxArray[i].cell.candidates);
                        // console.log('boxArray[j].cell.candidates: ', boxArray[j].cell.candidates);

                        // 从宫内其他单元格移除这些候选数
                        for (let k = 0; k < boxArray.length; k++) {
                            if (k !== i && k !== j && !boxArray[k].cell.isCellConstant()) {
                                const originalLength = boxArray[k].cell.candidates.length;
                                // 只看location: {x: 8, y: 0}的单元格
                                // if (boxArray[k].col === 8 && boxArray[k].row === 0) {
                                //     console.log('location: ', {x: boxArray[k].col, y: boxArray[k].row});
                                //     console.log('boxArray[k].cell.candidates: ', boxArray[k].cell.candidates);
                                //     debugger;
                                // }
                                boxArray[k].cell.candidates = boxArray[k].cell.candidates.filter(n => !candidates.includes(n));
                                // if (boxArray[k].col === 8 && boxArray[k].row === 0) {
                                //     console.log('boxArray[k].cell.candidates: ', boxArray[k].cell.candidates);
                                //     debugger;
                                // }

                                if (originalLength !== boxArray[k].cell.candidates.length) {
                                    strategyApplyCell.push({x: boxArray[k].col, y: boxArray[k].row});
                                    // // 只有当boxArray[k].cell.candidates里只有一个元素时才添加到strategyApplyCell
                                    // if (boxArray[k].cell.candidates.length === 1) {
                                    //     strategyApplyCell.push({x: boxArray[k].col, y: boxArray[k].row});
                                    // }
                                    boxArray[k].cell.strategies.push(this);
                                    // 添加相对位置
                                    boxArray[k].cell.relativePos.push({x: boxArray[i].col, y: boxArray[i].row});
                                    boxArray[k].cell.relativePos.push({x: boxArray[j].col, y: boxArray[j].row});
                                }
                            }
                        }
                    }
                }
            }
        }

        arraysEqual(a, b) {
            if (a.length !== b.length) return false;
            a.sort();
            b.sort();
            return a.every((val, index) => val === b[index]);
        }

        strategyDescription() {
            return this.description;
        }
    }

    const np = new NakedPairsStrategy();

    /**
     * Pointing Pairs 策略实现
     */
    class PointingPairsStrategy extends BaseStrategy {
        constructor(description = "Pointing Pairs", priority = 3) {
            super();
            this.description = description;
            this.priority = priority;
        }

        // 判断两个单元格是否在同一个宫内
        isSameBox(pos1, pos2) {
            return Math.floor(pos1.y / BOX_SIZE) === Math.floor(pos2.y / BOX_SIZE) &&
                Math.floor(pos1.x / BOX_SIZE) === Math.floor(pos2.x / BOX_SIZE);
        }

        /**
         * 检查是否满足 Pointing Pairs 策略的前置条件
         * @param grid {Array} 当前数独网格
         * @returns {boolean} 是否满足策略的应用条件
         */
        preCondition(grid) {
            // 遍历所有宫格（box）
            for (let boxRow = 0; boxRow < BOX_SIZE; boxRow++) {
                for (let boxCol = 0; boxCol < BOX_SIZE; boxCol++) {
                    let candidatesByNumber = {};

                    // 查找当前宫格内所有数字的候选位置
                    for (let row = boxRow * BOX_SIZE; row < (boxRow + 1) * BOX_SIZE; row++) {
                        for (let col = boxCol * BOX_SIZE; col < (boxCol + 1) * BOX_SIZE; col++) {
                            if (grid[row][col].isCellConstant()) continue; // 跳过常量单元格

                            // 对每个候选数字进行统计
                            for (let candidate of grid[row][col].candidates) {
                                if (!candidatesByNumber[candidate]) {
                                    candidatesByNumber[candidate] = { rows: new Set(), cols: new Set() };
                                }
                                candidatesByNumber[candidate].rows.add(row);
                                candidatesByNumber[candidate].cols.add(col);
                            }
                        }
                    }
                    // console.log(candidatesByNumber);

                    // 检查是否存在只能出现在某一行或某一列的候选数字
                    for (let candidate in candidatesByNumber) {
                        let { rows, cols } = candidatesByNumber[candidate];

                        // 如果该数字只出现在当前宫格的某一行或某一列
                        if (rows.size === 1 && cols.size > 1) {
                            let thisRow = [...rows][0];
                            for (let col = 0; col < SUDOKU_SIZE; col++) {
                                if (!this.isSameBox({x: boxCol * BOX_SIZE, y: thisRow}, {x: col, y: thisRow})) {
                                    if (!grid[thisRow][col].isCellConstant() && grid[thisRow][col].candidates.includes(parseInt(candidate))) {
                                        return true;//满足条件
                                    }
                                }
                            }
                        }

                        if (cols.size === 1 && rows.size > 1) {
                            let thisCol = [...cols][0];
                            for (let row = 0; row < SUDOKU_SIZE; row++) {
                                if (!this.isSameBox({ x: thisCol, y: boxRow * BOX_SIZE }, { x: thisCol, y: row })) {
                                    if (!grid[row][thisCol].isCellConstant() && grid[row][thisCol].candidates.includes(parseInt(candidate))) {
                                        return true;//满足条件
                                    }
                                }
                            }
                        }

                    }
                }
            }
            return false; // 不满足条件，不能应用策略
        }

        /**
         * 执行 Pointing Pairs 策略
         * @param grid {Array} 当前数独网格
         * @param strategyApplyCell {Array} 记录应用策略的单元格
         */
        apply(grid, strategyApplyCell) {
            // 遍历所有宫格（box）
            for (let boxRow = 0; boxRow < BOX_SIZE; boxRow++) {
                for (let boxCol = 0; boxCol < BOX_SIZE; boxCol++) {

                    let candidatesByNumber = [];

                    // 查找当前宫格内所有数字的候选位置
                    for (let row = boxRow * BOX_SIZE; row < (boxRow + 1) * BOX_SIZE; row++) {
                        for (let col = boxCol * BOX_SIZE; col < (boxCol + 1) * BOX_SIZE; col++) {

                            if (grid[row][col].isCellConstant()) continue; // 跳过常量单元格

                            // 对每个候选数字进行统计
                            for (let candidate of grid[row][col].candidates) {
                                // console.log('candidate ', candidate);
                                if (!candidatesByNumber[candidate]) {
                                    candidatesByNumber[candidate] = { rows: new Set(), cols: new Set() };
                                }
                                candidatesByNumber[candidate].rows.add(row);
                                candidatesByNumber[candidate].cols.add(col);
                                // console.log('candidatesByNumber:[candidate].rows ', candidatesByNumber[candidate].rows);
                                // console.log('candidatesByNumber:[candidate].cols ', candidatesByNumber[candidate].cols);
                            }
                        }
                    }

                    // console.log(candidatesByNumber); break;

                    // 遍历所有候选数字（一个宫中）
                    for (let candidate in candidatesByNumber) {

                        let { rows, cols } = candidatesByNumber[candidate];

                        // 如果该数字只出现在当前宫格的某一行，且不止出现在某一列
                        if (rows.size === 1 && cols.size > 1) {
                            let thisRow = [...rows][0];

                            // 对当前行的其他宫格进行排除该数字的操作
                            for (let col = 0; col < SUDOKU_SIZE; col++) {
                                if (!this.isSameBox({ x: boxCol * BOX_SIZE, y: thisRow }, { x: col, y: thisRow })) {
                                    if (!grid[thisRow][col].isCellConstant() && grid[thisRow][col].candidates.includes(parseInt(candidate))) {
                                        grid[thisRow][col].candidates = grid[thisRow][col].candidates.filter(c => c !== parseInt(candidate));

                                        // console.log(grid[thisRow][col].candidates);
                                        for (const value of cols) {
                                            strategyApplyCell.push({ x: value, y: thisRow });
                                            grid[thisRow][value].relativePos.push({ x: col, y: thisRow });
                                            grid[thisRow][value].strategies.push(this);
                                        }
                                    }
                                }
                            }
                        }

                        // 如果该数字只出现在当前宫格的某一列
                        if (cols.size === 1 && rows.size > 1) {
                            let thisCol = [...cols][0];

                            // 对当前列的其他宫格进行排除该数字的操作
                            for (let row = 0; row < SUDOKU_SIZE; row++) {
                                if (!this.isSameBox({ x: thisCol, y: boxRow * BOX_SIZE }, { x: thisCol, y: row })) {
                                    if (!grid[row][thisCol].isCellConstant() && grid[row][thisCol].candidates.includes(parseInt(candidate))) {
                                        grid[row][thisCol].candidates = grid[row][thisCol].candidates.filter(c => c !== parseInt(candidate));
                                        for (const value of rows) {
                                            strategyApplyCell.push({ x: thisCol, y: value });
                                            grid[value][thisCol].relativePos.push({ x: thisCol, y: row });
                                            grid[value][thisCol].strategies.push(this);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }





            }
        }

        /**
         * 策略描述
         * @returns {string} 策略描述
         */
        strategyDescription() {
            return this.description;
        }
    }

    const pp = new PointingPairsStrategy();

    class HiddenPairStrategy extends BaseStrategy {
      constructor(description = "Hidden Pair", priority = 0) {
        super();
        this.description = description;
        this.priority = priority;
        this.fullSetCandidates = Array.from({ length: SUDOKU_SIZE }).map((_, i) => i + 1);
      }

      preCondition(grid) {
        // 仅检查九宫格中的隐藏双数组
        for (let row = 0; row < SUDOKU_SIZE; row += BOX_SIZE) {
          for (let col = 0; col < SUDOKU_SIZE; col += BOX_SIZE) {
            // 检查当前九宫格是否有隐藏对
            let boxCandidates = [];
            let boxCells = [];
            for (let i = row; i < row + BOX_SIZE; i++) {
              for (let j = col; j < col + BOX_SIZE; j++) {
                if (!grid[i][j].isCellConstant()) {
                  boxCandidates.push(...grid[i][j].candidates);
                  boxCells.push({
                    x: j,  // 单元格的列索引
                    y: i,  // 单元格的行索引
                    candidates: grid[i][j].candidates // 存储单元格的候选数字
                  });
                }
              }
            }

            // 统计候选数字的出现次数
            let candidateCounts = this.getCandidateCounts(boxCandidates);
            let hiddenPairs = this.findHiddenPairs(candidateCounts, boxCandidates, boxCells);

            let int_hiddenPairs = hiddenPairs.map(item => parseInt(item));
            let candidatesWithTwoOccurrences = Object.keys(candidateCounts).filter(candidate => candidateCounts[candidate] === 2);
            let boxCells_candidatesWithTwoOccurrences = boxCells.filter(cell => candidatesWithTwoOccurrences.every(candidate => cell.candidates.includes(parseInt(candidate))));
            // flag定义为候选框中是否仅剩隐藏双数组的标志
            let flag = 0;
            for (let boxCell_candidatesWithTwoOccurrences of boxCells_candidatesWithTwoOccurrences){
                if (JSON.stringify(boxCell_candidatesWithTwoOccurrences.candidates) === JSON.stringify(int_hiddenPairs)){
                    flag = flag + 1;
                }
            }
            // 如果找到了隐藏对，返回true
            if (hiddenPairs.length > 0 && flag != 2) {
                return true;
            }
          }
        }
        return false;
      }

      apply(grid, strategyApplyCell) {
        // 仅在九宫格中应用隐藏双数组
        for (let row = 0; row < SUDOKU_SIZE; row += BOX_SIZE) {
          for (let col = 0; col < SUDOKU_SIZE; col += BOX_SIZE) {
            let boxCandidates = [];
            let boxCells = [];
            let relativePos = [];
            for (let i = row; i < row + BOX_SIZE; i++) {
              for (let j = col; j < col + BOX_SIZE; j++) {
                if (!grid[i][j].isCellConstant()) {
                  relativePos.push({x: j, y: i});
                  boxCandidates.push(...grid[i][j].candidates);
                  boxCells.push({
                    x: j,  // 单元格的列索引
                    y: i,  // 单元格的行索引
                    candidates: grid[i][j].candidates // 存储单元格的候选数字
                  });
                }
              }
            }
            // 统计候选数字的出现次数
            let candidateCounts = this.getCandidateCounts(boxCandidates);
            let hiddenPairs = this.findHiddenPairs(candidateCounts, boxCandidates, boxCells);
            
            if (hiddenPairs.length > 0) {
              // 仅保留属于隐藏对的候选数字
              let hiddenPairsAxis = this.removeNonHiddenPairCandidatesForBox(grid, hiddenPairs, boxCells);
              let newRelativePos = [];
              let flag = 0;
              for (let item of relativePos){
                for (let hiddenPairsaxis of hiddenPairsAxis){
                  if (item['x'] === hiddenPairsaxis['y'] && item['y'] === hiddenPairsaxis['x']){
                    flag = 1;
                  }
                }
                if (flag === 0){
                  newRelativePos.push(item);
                }
                flag = 0;
              }
              // console.log(grid['1']['8'].candidates, hiddenPairs)
              for (let axis of hiddenPairsAxis){
                strategyApplyCell.push(axis);
                grid[axis['x']][axis['y']].strategies.push(this);
                for (let relativeAxis of newRelativePos){
                  grid[axis['x']][axis['y']].relativePos.push(relativeAxis);
                } 
              } 
            }
          }
        }
      }

      // 计算候选值数量
      getCandidateCounts(candidates) {
        let candidateCounts = {};
        candidates.forEach(candidate => {
          candidateCounts[candidate] = (candidateCounts[candidate] || 0) + 1;
        });
        return candidateCounts;
      }

      // 找到隐藏双数组
      findHiddenPairs(candidateCounts, boxCandidates, boxCells) {
        let hiddenPairs = [];
        
        // 找到在box中出现了两次的数字
        let candidatesWithTwoOccurrences = Object.keys(candidateCounts).filter(candidate => candidateCounts[candidate] === 2);

        if (candidatesWithTwoOccurrences.length === 2){
            let cellsContainingCandidate = boxCells.filter(cell => candidatesWithTwoOccurrences.every(candidate => cell.candidates.includes(parseInt(candidate))));
            if (cellsContainingCandidate.length === 2) {
                hiddenPairs = candidatesWithTwoOccurrences;
            }
        }
        return hiddenPairs;
      }

      removeNonHiddenPairCandidatesForBox(grid, hiddenPairs, boxCells) {
        // 遍历九宫格中的每个单元格
        let hiddenPairs_axis = [];
        boxCells.forEach(cell => {
          // 检查当前单元格是否包含在隐藏双数组的两个候选数字中
          if (!grid[cell.y][cell.x].isCellConstant()) {
            // 如果当前单元格的候选数字中包含隐藏对中的任一数字，则保留这些候选数字
            if (hiddenPairs.every(candidate => grid[cell.y][cell.x].candidates.includes(parseInt(candidate)))) {
              // 只保留隐藏对中的候选数字
              grid[cell.y][cell.x].candidates = grid[cell.y][cell.x].candidates.filter(candidate => hiddenPairs.includes(String(candidate)));
              hiddenPairs_axis.push({ x: cell.y, y: cell.x });
            } 
          }
        });
        return hiddenPairs_axis
      }
      
      strategyDescription() {
        return this.description;
      }
    }

    const hp = new HiddenPairStrategy();
    //example: 19IQlAvAHzf1C2-dVlbZkANPkRIRa

    function CreateStrategyManager() {
      const strategiesSet = [];
      const isUsingStrategy = writable(false);
      const isGenerateSingleCandidate = writable(false);

      function determineEffectiveStrategy(grid, strategyApplyCell) {
        let hasChange = false;
        for (const { strategy, _ } of strategiesSet) {
          if (strategy.preCondition(grid)) {
            strategy.apply(grid, strategyApplyCell);
            hasChange = true;
          }
        }

        return hasChange;
      }

      return {
        addNewStrategy: (strategy, priority) => {
          strategiesSet.push({strategy: strategy, priority: priority});
          strategiesSet.sort((a, b) => a.priority - b.priority);
        },

        apply: (grid) => {
          isGenerateSingleCandidate.set(false);
          // Reset the relative position
          grid.map(row => row.map(cell => { cell.resetRelativePos(); cell.resetStrategies(); }));

          // Increase time step
          const strategyApplyCell = [];
          while (determineEffectiveStrategy(grid, strategyApplyCell)) {}

          for (let pos of strategyApplyCell) {
            if (grid[pos.y][pos.x].candidates.length === 1) {
              grid[pos.y][pos.x].explore = grid[pos.y][pos.x].candidates[0];
              isGenerateSingleCandidate.set(true);
            }
          }
          return strategyApplyCell;
        },

        getIsUsingStrategy: () => {
          return {
            subscribe: isUsingStrategy.subscribe,

            set(val) {
              isUsingStrategy.set(val);
            },

            reset() {
              isUsingStrategy.set(false);
            }
          }
        },

        getIsGenerateSingleCandidate: () => isGenerateSingleCandidate,
      }
    }

    const strategyManager = CreateStrategyManager();
    strategyManager.addNewStrategy(hs, hs.priority);
    strategyManager.addNewStrategy(np, np.priority);
    strategyManager.addNewStrategy(pp, pp.priority);
    strategyManager.addNewStrategy(hp, hp.priority);

    function CreateBranchBackManager() {
      let branchBackTimeSteps = [];
      const branchBackTimes = writable(0);

      return {
        getBranchBackTimes: () => branchBackTimes,

        getBranchBackTimeSteps: () => branchBackTimeSteps,

        resetBranchBackSteps: () => branchBackTimeSteps = [],

        addBranchBackTimeStep: (timeStep) => {
          branchBackTimeSteps[get_store_value(branchBackTimes)] = timeStep;
        },

        branchBackToLastBranchTimeStep: () => {
          strategyGrid.setTimeStep(get_store_value(branchBackTimes) === 0 ? 0 : branchBackTimeSteps[get_store_value(branchBackTimes) - 1]);
          strategyGrid.getStrategyGrid().update($strategyGrid => {
            $strategyGrid.map(row =>
                row.map(cell =>
                    cell.branchBack(get_store_value(branchBackTimes) === 0 ? 0 : branchBackTimeSteps[get_store_value(branchBackTimes) - 1])));
            return $strategyGrid;
          });
          strategyGrid.updateCellCandidates();

          strategyManager.getIsUsingStrategy().set(true);
          branchBackTimes.update(val => val - 1);
          cursor.reset();
        },

        branchBackToLastTimeStep: () => {
          strategyGrid.setTimeStep(get_store_value(strategyGrid.getTimeStep()) - 1);
          const branchBackTimeStep = get_store_value(strategyGrid.getTimeStep());

          strategyGrid.getStrategyGrid().update($strategyGrid => {
            $strategyGrid.map(row =>
                row.map(cell => cell.branchBack(branchBackTimeStep)));

            return $strategyGrid;
          });
          strategyGrid.updateCellCandidates();

          // Update branch back time steps
          if (branchBackTimeSteps.length > 0 && branchBackTimeStep < branchBackTimeSteps[get_store_value(branchBackTimes) - 1]) {
            branchBackTimes.update(val => val - 1);
          } else if (branchBackTimeSteps.length > 0 && branchBackTimeStep === branchBackTimeSteps[get_store_value(branchBackTimes) - 1]) {
            branchBackTimes.update(val => val - 1);
            strategyManager.getIsUsingStrategy().set(true);
          }

          cursor.reset();
        }
      }
    }

    const branchBackManager = CreateBranchBackManager();

    function createCandidates() {
    	const candidates = writable({});

    	return {
    		subscribe: candidates.subscribe,

    		add(pos, candidate) {
    			candidates.update($candidates => {
    				if (!$candidates.hasOwnProperty(pos.x + ',' + pos.y)) {
    					$candidates[pos.x + ',' + pos.y] = [candidate];
    				} else if ($candidates[pos.x + ',' + pos.y].includes(candidate)) {
    					delete $candidates[pos.x + ',' + pos.y][$candidates[pos.x + ',' + pos.y].indexOf(candidate)];
    				} else {
    					$candidates[pos.x + ',' + pos.y].push(candidate);
    				}

    				return $candidates;
    			});
    		},

    		clear(pos) {
    			candidates.update($candidates => {
    				delete $candidates[pos.x + ',' + pos.y];
    				return $candidates;
    			});
    		}
    	}
    }

    const candidates = createCandidates();

    /* src/components/Board/Candidates.svelte generated by Svelte v3.49.0 */
    const file = "src/components/Board/Candidates.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i][0];
    	child_ctx[6] = list[i][1];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (31:1) {#each CANDIDATE_COORDS as [row, col], index}
    function create_each_block(ctx) {
    	let button;
    	let t0_value = /*index*/ ctx[8] + 1 + "";
    	let t0;
    	let t1;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*index*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", button_class_value = "candidate row-start-" + /*row*/ ctx[5] + " col-start-" + /*col*/ ctx[6] + " svelte-qb88xr");
    			toggle_class(button, "invisible", !/*candidates*/ ctx[0].includes(/*index*/ ctx[8] + 1));
    			toggle_class(button, "visible", /*candidates*/ ctx[0].includes(/*index*/ ctx[8] + 1));
    			add_location(button, file, 31, 2, 1028);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*candidates*/ 1) {
    				toggle_class(button, "invisible", !/*candidates*/ ctx[0].includes(/*index*/ ctx[8] + 1));
    			}

    			if (dirty & /*candidates*/ 1) {
    				toggle_class(button, "visible", /*candidates*/ ctx[0].includes(/*index*/ ctx[8] + 1));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(31:1) {#each CANDIDATE_COORDS as [row, col], index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let each_value = CANDIDATE_COORDS;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "candidate-grid svelte-qb88xr");
    			add_location(div, file, 29, 0, 950);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*CANDIDATE_COORDS, candidates, tryToSetCandidate*/ 3) {
    				each_value = CANDIDATE_COORDS;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Candidates', slots, []);
    	let { candidates = [] } = $$props;
    	let { gridRow } = $$props;
    	let { gridCol } = $$props;

    	function tryToSetCandidate(val) {
    		if (!candidates.includes(val)) {
    			return;
    		}

    		// update strategy grid state
    		strategyGrid.increaseTimeStep();

    		strategyManager.getIsUsingStrategy().set(false);
    		strategyManager.getIsGenerateSingleCandidate().set(true);

    		get_store_value(strategyGrid.getStrategyGrid()).map(row => row.map(cell => {
    			cell.resetRelativePos();
    			cell.resetStrategies();
    		}));

    		strategyGrid.set({ x: gridCol, y: gridRow }, val);
    		strategyGrid.updateCellCandidates();

    		// Update branch back times
    		branchBackManager.getBranchBackTimes().update(val => val + 1);
    	}

    	const writable_props = ['candidates', 'gridRow', 'gridCol'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Candidates> was created with unknown prop '${key}'`);
    	});

    	const click_handler = index => tryToSetCandidate(index + 1);

    	$$self.$$set = $$props => {
    		if ('candidates' in $$props) $$invalidate(0, candidates = $$props.candidates);
    		if ('gridRow' in $$props) $$invalidate(2, gridRow = $$props.gridRow);
    		if ('gridCol' in $$props) $$invalidate(3, gridCol = $$props.gridCol);
    	};

    	$$self.$capture_state = () => ({
    		CANDIDATE_COORDS,
    		strategyManager,
    		strategyGrid,
    		branchBackManager,
    		get: get_store_value,
    		candidates,
    		gridRow,
    		gridCol,
    		tryToSetCandidate
    	});

    	$$self.$inject_state = $$props => {
    		if ('candidates' in $$props) $$invalidate(0, candidates = $$props.candidates);
    		if ('gridRow' in $$props) $$invalidate(2, gridRow = $$props.gridRow);
    		if ('gridCol' in $$props) $$invalidate(3, gridCol = $$props.gridCol);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [candidates, tryToSetCandidate, gridRow, gridCol, click_handler];
    }

    class Candidates extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { candidates: 0, gridRow: 2, gridCol: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Candidates",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*gridRow*/ ctx[2] === undefined && !('gridRow' in props)) {
    			console.warn("<Candidates> was created without expected prop 'gridRow'");
    		}

    		if (/*gridCol*/ ctx[3] === undefined && !('gridCol' in props)) {
    			console.warn("<Candidates> was created without expected prop 'gridCol'");
    		}
    	}

    	get candidates() {
    		throw new Error("<Candidates>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set candidates(value) {
    		throw new Error("<Candidates>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gridRow() {
    		throw new Error("<Candidates>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gridRow(value) {
    		throw new Error("<Candidates>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gridCol() {
    		throw new Error("<Candidates>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gridCol(value) {
    		throw new Error("<Candidates>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src/components/Board/Cell.svelte generated by Svelte v3.49.0 */
    const file$1 = "src/components/Board/Cell.svelte";

    // (35:1) {#if !disabled}
    function create_if_block(ctx) {
    	let div;
    	let button;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_1, create_if_block_2, create_if_block_3, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*candidates*/ ctx[3].length > 1 && (/*strategyCell*/ ctx[11] || /*relativeCell*/ ctx[12])) return 0;
    		if (/*candidates*/ ctx[3].length === 1 && /*relativeCell*/ ctx[12]) return 1;
    		if (/*candidates*/ ctx[3].length === 0 && /*strategyCell*/ ctx[11]) return 2;
    		return 3;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			if_block.c();
    			attr_dev(button, "class", "cell-btn svelte-14bgnkc");
    			add_location(button, file$1, 45, 3, 1439);
    			attr_dev(div, "class", "cell-inner svelte-14bgnkc");
    			toggle_class(div, "user-number", /*userNumber*/ ctx[7]);
    			toggle_class(div, "selected", /*selected*/ ctx[8]);
    			toggle_class(div, "same-area", /*sameArea*/ ctx[9]);
    			toggle_class(div, "same-number", /*sameNumber*/ ctx[10]);
    			toggle_class(div, "conflicting-number", /*conflictingNumber*/ ctx[6]);
    			toggle_class(div, "strategy-cell", /*strategyCell*/ ctx[11]);
    			toggle_class(div, "relative-cell", /*relativeCell*/ ctx[12]);
    			toggle_class(div, "invalid-candidate", /*invalidCandidate*/ ctx[13]);
    			add_location(div, file$1, 35, 2, 1088);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			if_blocks[current_block_type_index].m(button, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(cursor.set(/*cellX*/ ctx[1] - 1, /*cellY*/ ctx[2] - 1))) cursor.set(/*cellX*/ ctx[1] - 1, /*cellY*/ ctx[2] - 1).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(button, null);
    			}

    			if (dirty & /*userNumber*/ 128) {
    				toggle_class(div, "user-number", /*userNumber*/ ctx[7]);
    			}

    			if (dirty & /*selected*/ 256) {
    				toggle_class(div, "selected", /*selected*/ ctx[8]);
    			}

    			if (dirty & /*sameArea*/ 512) {
    				toggle_class(div, "same-area", /*sameArea*/ ctx[9]);
    			}

    			if (dirty & /*sameNumber*/ 1024) {
    				toggle_class(div, "same-number", /*sameNumber*/ ctx[10]);
    			}

    			if (dirty & /*conflictingNumber*/ 64) {
    				toggle_class(div, "conflicting-number", /*conflictingNumber*/ ctx[6]);
    			}

    			if (dirty & /*strategyCell*/ 2048) {
    				toggle_class(div, "strategy-cell", /*strategyCell*/ ctx[11]);
    			}

    			if (dirty & /*relativeCell*/ 4096) {
    				toggle_class(div, "relative-cell", /*relativeCell*/ ctx[12]);
    			}

    			if (dirty & /*invalidCandidate*/ 8192) {
    				toggle_class(div, "invalid-candidate", /*invalidCandidate*/ ctx[13]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(35:1) {#if !disabled}",
    		ctx
    	});

    	return block;
    }

    // (53:4) {:else}
    function create_else_block(ctx) {
    	let span;
    	let t_value = (/*explore*/ ctx[4] || /*value*/ ctx[0] || '') + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "cell-text svelte-14bgnkc");
    			add_location(span, file$1, 53, 5, 1866);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*explore, value*/ 17 && t_value !== (t_value = (/*explore*/ ctx[4] || /*value*/ ctx[0] || '') + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(53:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (51:54) 
    function create_if_block_3(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "0";
    			attr_dev(span, "class", "cell-text svelte-14bgnkc");
    			add_location(span, file$1, 51, 5, 1816);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(51:54) ",
    		ctx
    	});

    	return block;
    }

    // (49:55) 
    function create_if_block_2(ctx) {
    	let span;
    	let t_value = /*candidates*/ ctx[3][0] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "cell-text svelte-14bgnkc");
    			add_location(span, file$1, 49, 5, 1708);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*candidates*/ 8 && t_value !== (t_value = /*candidates*/ ctx[3][0] + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(49:55) ",
    		ctx
    	});

    	return block;
    }

    // (47:4) {#if candidates.length > 1 && (strategyCell || relativeCell)}
    function create_if_block_1(ctx) {
    	let candidates_1;
    	let current;

    	candidates_1 = new Candidates({
    			props: {
    				candidates: /*candidates*/ ctx[3],
    				gridRow: /*cellY*/ ctx[2] - 1,
    				gridCol: /*cellX*/ ctx[1] - 1
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(candidates_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(candidates_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const candidates_1_changes = {};
    			if (dirty & /*candidates*/ 8) candidates_1_changes.candidates = /*candidates*/ ctx[3];
    			if (dirty & /*cellY*/ 4) candidates_1_changes.gridRow = /*cellY*/ ctx[2] - 1;
    			if (dirty & /*cellX*/ 2) candidates_1_changes.gridCol = /*cellX*/ ctx[1] - 1;
    			candidates_1.$set(candidates_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(candidates_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(candidates_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(candidates_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(47:4) {#if candidates.length > 1 && (strategyCell || relativeCell)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	let if_block = !/*disabled*/ ctx[5] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", div_class_value = "cell row-start-" + /*cellY*/ ctx[2] + " col-start-" + /*cellX*/ ctx[1] + " svelte-14bgnkc");
    			toggle_class(div, "border-r", /*borderRight*/ ctx[14]);
    			toggle_class(div, "border-r-4", /*borderRightBold*/ ctx[15]);
    			toggle_class(div, "border-b", /*borderBottom*/ ctx[16]);
    			toggle_class(div, "border-b-4", /*borderBottomBold*/ ctx[17]);
    			add_location(div, file$1, 29, 0, 864);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*disabled*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*disabled*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*cellY, cellX*/ 6 && div_class_value !== (div_class_value = "cell row-start-" + /*cellY*/ ctx[2] + " col-start-" + /*cellX*/ ctx[1] + " svelte-14bgnkc")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*cellY, cellX, borderRight*/ 16390) {
    				toggle_class(div, "border-r", /*borderRight*/ ctx[14]);
    			}

    			if (dirty & /*cellY, cellX, borderRightBold*/ 32774) {
    				toggle_class(div, "border-r-4", /*borderRightBold*/ ctx[15]);
    			}

    			if (dirty & /*cellY, cellX, borderBottom*/ 65542) {
    				toggle_class(div, "border-b", /*borderBottom*/ ctx[16]);
    			}

    			if (dirty & /*cellY, cellX, borderBottomBold*/ 131078) {
    				toggle_class(div, "border-b-4", /*borderBottomBold*/ ctx[17]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Cell', slots, []);
    	let { value } = $$props;
    	let { cellX } = $$props;
    	let { cellY } = $$props;
    	let { candidates } = $$props;
    	let { explore } = $$props;
    	let { disabled } = $$props;
    	let { conflictingNumber } = $$props;
    	let { userNumber } = $$props;
    	let { selected } = $$props;
    	let { sameArea } = $$props;
    	let { sameNumber } = $$props;
    	let { strategyCell } = $$props;
    	let { relativeCell } = $$props;
    	let { invalidCandidate } = $$props;
    	const borderRight = cellX !== SUDOKU_SIZE && cellX % 3 !== 0;
    	const borderRightBold = cellX !== SUDOKU_SIZE && cellX % 3 === 0;
    	const borderBottom = cellY !== SUDOKU_SIZE && cellY % 3 !== 0;
    	const borderBottomBold = cellY !== SUDOKU_SIZE && cellY % 3 === 0;

    	const writable_props = [
    		'value',
    		'cellX',
    		'cellY',
    		'candidates',
    		'explore',
    		'disabled',
    		'conflictingNumber',
    		'userNumber',
    		'selected',
    		'sameArea',
    		'sameNumber',
    		'strategyCell',
    		'relativeCell',
    		'invalidCandidate'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Cell> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('cellX' in $$props) $$invalidate(1, cellX = $$props.cellX);
    		if ('cellY' in $$props) $$invalidate(2, cellY = $$props.cellY);
    		if ('candidates' in $$props) $$invalidate(3, candidates = $$props.candidates);
    		if ('explore' in $$props) $$invalidate(4, explore = $$props.explore);
    		if ('disabled' in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ('conflictingNumber' in $$props) $$invalidate(6, conflictingNumber = $$props.conflictingNumber);
    		if ('userNumber' in $$props) $$invalidate(7, userNumber = $$props.userNumber);
    		if ('selected' in $$props) $$invalidate(8, selected = $$props.selected);
    		if ('sameArea' in $$props) $$invalidate(9, sameArea = $$props.sameArea);
    		if ('sameNumber' in $$props) $$invalidate(10, sameNumber = $$props.sameNumber);
    		if ('strategyCell' in $$props) $$invalidate(11, strategyCell = $$props.strategyCell);
    		if ('relativeCell' in $$props) $$invalidate(12, relativeCell = $$props.relativeCell);
    		if ('invalidCandidate' in $$props) $$invalidate(13, invalidCandidate = $$props.invalidCandidate);
    	};

    	$$self.$capture_state = () => ({
    		Candidates,
    		fade,
    		SUDOKU_SIZE,
    		cursor,
    		strategyGrid,
    		value,
    		cellX,
    		cellY,
    		candidates,
    		explore,
    		disabled,
    		conflictingNumber,
    		userNumber,
    		selected,
    		sameArea,
    		sameNumber,
    		strategyCell,
    		relativeCell,
    		invalidCandidate,
    		borderRight,
    		borderRightBold,
    		borderBottom,
    		borderBottomBold
    	});

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('cellX' in $$props) $$invalidate(1, cellX = $$props.cellX);
    		if ('cellY' in $$props) $$invalidate(2, cellY = $$props.cellY);
    		if ('candidates' in $$props) $$invalidate(3, candidates = $$props.candidates);
    		if ('explore' in $$props) $$invalidate(4, explore = $$props.explore);
    		if ('disabled' in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ('conflictingNumber' in $$props) $$invalidate(6, conflictingNumber = $$props.conflictingNumber);
    		if ('userNumber' in $$props) $$invalidate(7, userNumber = $$props.userNumber);
    		if ('selected' in $$props) $$invalidate(8, selected = $$props.selected);
    		if ('sameArea' in $$props) $$invalidate(9, sameArea = $$props.sameArea);
    		if ('sameNumber' in $$props) $$invalidate(10, sameNumber = $$props.sameNumber);
    		if ('strategyCell' in $$props) $$invalidate(11, strategyCell = $$props.strategyCell);
    		if ('relativeCell' in $$props) $$invalidate(12, relativeCell = $$props.relativeCell);
    		if ('invalidCandidate' in $$props) $$invalidate(13, invalidCandidate = $$props.invalidCandidate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		value,
    		cellX,
    		cellY,
    		candidates,
    		explore,
    		disabled,
    		conflictingNumber,
    		userNumber,
    		selected,
    		sameArea,
    		sameNumber,
    		strategyCell,
    		relativeCell,
    		invalidCandidate,
    		borderRight,
    		borderRightBold,
    		borderBottom,
    		borderBottomBold
    	];
    }

    class Cell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			value: 0,
    			cellX: 1,
    			cellY: 2,
    			candidates: 3,
    			explore: 4,
    			disabled: 5,
    			conflictingNumber: 6,
    			userNumber: 7,
    			selected: 8,
    			sameArea: 9,
    			sameNumber: 10,
    			strategyCell: 11,
    			relativeCell: 12,
    			invalidCandidate: 13
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cell",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !('value' in props)) {
    			console.warn("<Cell> was created without expected prop 'value'");
    		}

    		if (/*cellX*/ ctx[1] === undefined && !('cellX' in props)) {
    			console.warn("<Cell> was created without expected prop 'cellX'");
    		}

    		if (/*cellY*/ ctx[2] === undefined && !('cellY' in props)) {
    			console.warn("<Cell> was created without expected prop 'cellY'");
    		}

    		if (/*candidates*/ ctx[3] === undefined && !('candidates' in props)) {
    			console.warn("<Cell> was created without expected prop 'candidates'");
    		}

    		if (/*explore*/ ctx[4] === undefined && !('explore' in props)) {
    			console.warn("<Cell> was created without expected prop 'explore'");
    		}

    		if (/*disabled*/ ctx[5] === undefined && !('disabled' in props)) {
    			console.warn("<Cell> was created without expected prop 'disabled'");
    		}

    		if (/*conflictingNumber*/ ctx[6] === undefined && !('conflictingNumber' in props)) {
    			console.warn("<Cell> was created without expected prop 'conflictingNumber'");
    		}

    		if (/*userNumber*/ ctx[7] === undefined && !('userNumber' in props)) {
    			console.warn("<Cell> was created without expected prop 'userNumber'");
    		}

    		if (/*selected*/ ctx[8] === undefined && !('selected' in props)) {
    			console.warn("<Cell> was created without expected prop 'selected'");
    		}

    		if (/*sameArea*/ ctx[9] === undefined && !('sameArea' in props)) {
    			console.warn("<Cell> was created without expected prop 'sameArea'");
    		}

    		if (/*sameNumber*/ ctx[10] === undefined && !('sameNumber' in props)) {
    			console.warn("<Cell> was created without expected prop 'sameNumber'");
    		}

    		if (/*strategyCell*/ ctx[11] === undefined && !('strategyCell' in props)) {
    			console.warn("<Cell> was created without expected prop 'strategyCell'");
    		}

    		if (/*relativeCell*/ ctx[12] === undefined && !('relativeCell' in props)) {
    			console.warn("<Cell> was created without expected prop 'relativeCell'");
    		}

    		if (/*invalidCandidate*/ ctx[13] === undefined && !('invalidCandidate' in props)) {
    			console.warn("<Cell> was created without expected prop 'invalidCandidate'");
    		}
    	}

    	get value() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cellX() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cellX(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cellY() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cellY(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get candidates() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set candidates(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get explore() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set explore(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get conflictingNumber() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set conflictingNumber(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userNumber() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userNumber(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sameArea() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sameArea(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sameNumber() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sameNumber(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get strategyCell() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set strategyCell(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get relativeCell() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set relativeCell(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalidCandidate() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalidCandidate(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Board/index.svelte generated by Svelte v3.49.0 */
    const file$2 = "src/components/Board/index.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (90:4) {#each row as value, x}
    function create_each_block_1(ctx) {
    	let cell;
    	let current;

    	cell = new Cell({
    			props: {
    				value: /*value*/ ctx[15],
    				cellY: /*y*/ ctx[14] + 1,
    				cellX: /*x*/ ctx[17] + 1,
    				candidates: /*$strategyGrid*/ ctx[3][/*y*/ ctx[14]][/*x*/ ctx[17]].candidates,
    				explore: /*$strategyGrid*/ ctx[3][/*y*/ ctx[14]][/*x*/ ctx[17]].explore,
    				disabled: /*$gamePaused*/ ctx[1],
    				selected: isSelected(/*$cursor*/ ctx[4], /*x*/ ctx[17], /*y*/ ctx[14]),
    				userNumber: /*$grid*/ ctx[2][/*y*/ ctx[14]][/*x*/ ctx[17]] === 0,
    				sameArea: /*$settings*/ ctx[5].highlightCells && !isSelected(/*$cursor*/ ctx[4], /*x*/ ctx[17], /*y*/ ctx[14]) && /*isSameArea*/ ctx[8](/*$cursor*/ ctx[4], /*x*/ ctx[17], /*y*/ ctx[14]),
    				sameNumber: /*$settings*/ ctx[5].highlightSame && /*value*/ ctx[15] && !isSelected(/*$cursor*/ ctx[4], /*x*/ ctx[17], /*y*/ ctx[14]) && getValueAtCursor(/*$userGrid*/ ctx[6], /*$cursor*/ ctx[4]) === /*value*/ ctx[15],
    				conflictingNumber: /*$settings*/ ctx[5].highlightConflicting && /*$grid*/ ctx[2][/*y*/ ctx[14]][/*x*/ ctx[17]] === 0 && /*$strategyGrid*/ ctx[3][/*y*/ ctx[14]][/*x*/ ctx[17]].explore !== 0 && !/*$strategyGrid*/ ctx[3][/*y*/ ctx[14]][/*x*/ ctx[17]].candidates.includes(/*$strategyGrid*/ ctx[3][/*y*/ ctx[14]][/*x*/ ctx[17]].explore),
    				strategyCell: /*isStrategyCell*/ ctx[9](/*$isUsingStrategy*/ ctx[7], /*$strategyGrid*/ ctx[3], /*y*/ ctx[14], /*x*/ ctx[17]),
    				relativeCell: /*isRelativeCell*/ ctx[10](/*$isUsingStrategy*/ ctx[7], /*$strategyGrid*/ ctx[3], /*$cursor*/ ctx[4], /*y*/ ctx[14], /*x*/ ctx[17]),
    				invalidCandidate: /*isInValidateCandidate*/ ctx[11](/*$strategyGrid*/ ctx[3], /*y*/ ctx[14], /*x*/ ctx[17])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cell.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cell_changes = {};
    			if (dirty & /*$grid*/ 4) cell_changes.value = /*value*/ ctx[15];
    			if (dirty & /*$strategyGrid*/ 8) cell_changes.candidates = /*$strategyGrid*/ ctx[3][/*y*/ ctx[14]][/*x*/ ctx[17]].candidates;
    			if (dirty & /*$strategyGrid*/ 8) cell_changes.explore = /*$strategyGrid*/ ctx[3][/*y*/ ctx[14]][/*x*/ ctx[17]].explore;
    			if (dirty & /*$gamePaused*/ 2) cell_changes.disabled = /*$gamePaused*/ ctx[1];
    			if (dirty & /*$cursor*/ 16) cell_changes.selected = isSelected(/*$cursor*/ ctx[4], /*x*/ ctx[17], /*y*/ ctx[14]);
    			if (dirty & /*$grid*/ 4) cell_changes.userNumber = /*$grid*/ ctx[2][/*y*/ ctx[14]][/*x*/ ctx[17]] === 0;
    			if (dirty & /*$settings, $cursor*/ 48) cell_changes.sameArea = /*$settings*/ ctx[5].highlightCells && !isSelected(/*$cursor*/ ctx[4], /*x*/ ctx[17], /*y*/ ctx[14]) && /*isSameArea*/ ctx[8](/*$cursor*/ ctx[4], /*x*/ ctx[17], /*y*/ ctx[14]);
    			if (dirty & /*$settings, $grid, $cursor, $userGrid*/ 116) cell_changes.sameNumber = /*$settings*/ ctx[5].highlightSame && /*value*/ ctx[15] && !isSelected(/*$cursor*/ ctx[4], /*x*/ ctx[17], /*y*/ ctx[14]) && getValueAtCursor(/*$userGrid*/ ctx[6], /*$cursor*/ ctx[4]) === /*value*/ ctx[15];
    			if (dirty & /*$settings, $grid, $strategyGrid*/ 44) cell_changes.conflictingNumber = /*$settings*/ ctx[5].highlightConflicting && /*$grid*/ ctx[2][/*y*/ ctx[14]][/*x*/ ctx[17]] === 0 && /*$strategyGrid*/ ctx[3][/*y*/ ctx[14]][/*x*/ ctx[17]].explore !== 0 && !/*$strategyGrid*/ ctx[3][/*y*/ ctx[14]][/*x*/ ctx[17]].candidates.includes(/*$strategyGrid*/ ctx[3][/*y*/ ctx[14]][/*x*/ ctx[17]].explore);
    			if (dirty & /*$isUsingStrategy, $strategyGrid*/ 136) cell_changes.strategyCell = /*isStrategyCell*/ ctx[9](/*$isUsingStrategy*/ ctx[7], /*$strategyGrid*/ ctx[3], /*y*/ ctx[14], /*x*/ ctx[17]);
    			if (dirty & /*$isUsingStrategy, $strategyGrid, $cursor*/ 152) cell_changes.relativeCell = /*isRelativeCell*/ ctx[10](/*$isUsingStrategy*/ ctx[7], /*$strategyGrid*/ ctx[3], /*$cursor*/ ctx[4], /*y*/ ctx[14], /*x*/ ctx[17]);
    			if (dirty & /*$strategyGrid*/ 8) cell_changes.invalidCandidate = /*isInValidateCandidate*/ ctx[11](/*$strategyGrid*/ ctx[3], /*y*/ ctx[14], /*x*/ ctx[17]);
    			cell.$set(cell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(90:4) {#each row as value, x}",
    		ctx
    	});

    	return block;
    }

    // (89:3) {#each $grid as row, y}
    function create_each_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*row*/ ctx[12];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$grid, $strategyGrid, $gamePaused, isSelected, $cursor, $settings, isSameArea, getValueAtCursor, $userGrid, isStrategyCell, $isUsingStrategy, isRelativeCell, isInValidateCandidate*/ 4094) {
    				each_value_1 = /*row*/ ctx[12];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(89:3) {#each $grid as row, y}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div4;
    	let div1;
    	let div0;
    	let t;
    	let div3;
    	let div2;
    	let current;
    	let each_value = /*$grid*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			div3 = element("div");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "w-full");
    			set_style(div0, "padding-top", "100%");
    			add_location(div0, file$2, 82, 2, 3248);
    			attr_dev(div1, "class", "max-w-xl relative");
    			add_location(div1, file$2, 81, 1, 3214);
    			attr_dev(div2, "class", "bg-white shadow-2xl rounded-xl overflow-hidden w-full h-full max-w-xl grid");
    			toggle_class(div2, "bg-gray-200", /*$gamePaused*/ ctx[1]);
    			add_location(div2, file$2, 86, 2, 3378);
    			attr_dev(div3, "class", "board-padding absolute inset-0 flex justify-center svelte-1fxwp83");
    			add_location(div3, file$2, 84, 1, 3310);
    			attr_dev(div4, "class", "board-padding relative z-10 svelte-1fxwp83");
    			add_location(div4, file$2, 80, 0, 3171);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div4, t);
    			append_dev(div4, div3);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$grid, $strategyGrid, $gamePaused, isSelected, $cursor, $settings, isSameArea, getValueAtCursor, $userGrid, isStrategyCell, $isUsingStrategy, isRelativeCell, isInValidateCandidate*/ 4094) {
    				each_value = /*$grid*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div2, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*$gamePaused*/ 2) {
    				toggle_class(div2, "bg-gray-200", /*$gamePaused*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isSelected(cursorStore, x, y) {
    	return cursorStore.x === x && cursorStore.y === y;
    }

    function getValueAtCursor(gridStore, cursorStore) {
    	if (cursorStore.x === null && cursorStore.y === null) return null;
    	return gridStore[cursorStore.y][cursorStore.x];
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let isUsingStrategy;
    	let $gamePaused;
    	let $grid;
    	let $strategyGrid;
    	let $cursor;
    	let $settings;
    	let $userGrid;

    	let $isUsingStrategy,
    		$$unsubscribe_isUsingStrategy = noop,
    		$$subscribe_isUsingStrategy = () => ($$unsubscribe_isUsingStrategy(), $$unsubscribe_isUsingStrategy = subscribe(isUsingStrategy, $$value => $$invalidate(7, $isUsingStrategy = $$value)), isUsingStrategy);

    	validate_store(gamePaused, 'gamePaused');
    	component_subscribe($$self, gamePaused, $$value => $$invalidate(1, $gamePaused = $$value));
    	validate_store(grid, 'grid');
    	component_subscribe($$self, grid, $$value => $$invalidate(2, $grid = $$value));
    	validate_store(strategyGrid, 'strategyGrid');
    	component_subscribe($$self, strategyGrid, $$value => $$invalidate(3, $strategyGrid = $$value));
    	validate_store(cursor, 'cursor');
    	component_subscribe($$self, cursor, $$value => $$invalidate(4, $cursor = $$value));
    	validate_store(settings, 'settings');
    	component_subscribe($$self, settings, $$value => $$invalidate(5, $settings = $$value));
    	validate_store(userGrid, 'userGrid');
    	component_subscribe($$self, userGrid, $$value => $$invalidate(6, $userGrid = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_isUsingStrategy());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Board', slots, []);

    	function isSameArea(cursorStore, x, y) {
    		if (cursorStore.x === null && cursorStore.y === null) return false;
    		if (cursorStore.x === x || cursorStore.y === y) return true;
    		const cursorBoxX = Math.floor(cursorStore.x / BOX_SIZE);
    		const cursorBoxY = Math.floor(cursorStore.y / BOX_SIZE);
    		const cellBoxX = Math.floor(x / BOX_SIZE);
    		const cellBoxY = Math.floor(y / BOX_SIZE);
    		return cursorBoxX === cellBoxX && cursorBoxY === cellBoxY;
    	}

    	function isStrategyCell(isUsingStrategy, strategyGridStore, y, x) {
    		if (x === null || y === null) return false;
    		return isUsingStrategy && strategyGridStore[y][x].isUserCell() && strategyGridStore[y][x].strategies != null && strategyGridStore[y][x].strategies.length > 0;
    	}

    	function isRelativeCell(isUsingStrategy, strategyGridStore, cursorStore, y, x) {
    		return cursorStore.x !== null && cursorStore.y !== null && isStrategyCell(isUsingStrategy, strategyGridStore, cursorStore.y, cursorStore.x) && strategyGridStore[cursorStore.y][cursorStore.x].relativePos !== null && strategyGridStore[cursorStore.y][cursorStore.x].relativePos.some(cell => cell.x === x && cell.y === y);
    	}

    	function isInValidateCandidate(strategyGridStore, y, x) {
    		if (!(strategyGridStore[y][x].isUserCell() && strategyGridStore[y][x].explore !== 0)) return false;
    		if (strategyGridStore[y][x].isUserCell() && strategyGridStore[y][x].candidates.length === 0) return true;

    		// Check for row
    		for (let col = 0; col < SUDOKU_SIZE; col++) {
    			if (strategyGridStore[y][col].isCellConstant() && strategyGridStore[y][col].getCurrentCell() === strategyGridStore[y][x].explore && col !== x) return true;
    		}

    		// Check for col
    		for (let row = 0; row < SUDOKU_SIZE; row++) {
    			if (strategyGridStore[row][x].isCellConstant() && strategyGridStore[row][x].getCurrentCell() === strategyGridStore[y][x].explore && row !== y) return true;
    		}

    		// Check for box
    		const startRow = Math.floor(y / BOX_SIZE) * BOX_SIZE;

    		const startCol = Math.floor(x / BOX_SIZE) * BOX_SIZE;

    		for (let i = startRow; i < startRow + BOX_SIZE; i++) {
    			for (let j = startCol; j < startCol + BOX_SIZE; j++) {
    				if (i !== y && j !== x && strategyGridStore[i][j].isCellConstant() && strategyGridStore[i][j].getCurrentCell() === strategyGridStore[y][x].explore) {
    					return true;
    				}
    			}
    		}

    		return false;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Board> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		BOX_SIZE,
    		SUDOKU_SIZE,
    		gamePaused,
    		grid,
    		userGrid,
    		invalidCells,
    		strategyGrid,
    		settings,
    		cursor,
    		candidates,
    		strategyManager,
    		Cell,
    		isSelected,
    		isSameArea,
    		getValueAtCursor,
    		isStrategyCell,
    		isRelativeCell,
    		isInValidateCandidate,
    		isUsingStrategy,
    		$gamePaused,
    		$grid,
    		$strategyGrid,
    		$cursor,
    		$settings,
    		$userGrid,
    		$isUsingStrategy
    	});

    	$$self.$inject_state = $$props => {
    		if ('isUsingStrategy' in $$props) $$subscribe_isUsingStrategy($$invalidate(0, isUsingStrategy = $$props.isUsingStrategy));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$subscribe_isUsingStrategy($$invalidate(0, isUsingStrategy = strategyManager.getIsUsingStrategy()));

    	return [
    		isUsingStrategy,
    		$gamePaused,
    		$grid,
    		$strategyGrid,
    		$cursor,
    		$settings,
    		$userGrid,
    		$isUsingStrategy,
    		isSameArea,
    		isStrategyCell,
    		isRelativeCell,
    		isInValidateCandidate
    	];
    }

    class Board extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Board",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Controls/ActionBar/StrategyDescription.svelte generated by Svelte v3.49.0 */
    const file$3 = "src/components/Controls/ActionBar/StrategyDescription.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (17:0) {#if isStrategyCell($isUsingStrategy, $strategyGrid, $cursor)}
    function create_if_block$1(ctx) {
    	let div;
    	let each_value = /*$strategyGrid*/ ctx[2][/*$cursor*/ ctx[3].y][/*$cursor*/ ctx[3].x].strategies;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "strategy-description-board svelte-15u9og0");
    			add_location(div, file$3, 17, 0, 754);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$strategyGrid, $cursor*/ 12) {
    				each_value = /*$strategyGrid*/ ctx[2][/*$cursor*/ ctx[3].y][/*$cursor*/ ctx[3].x].strategies;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(17:0) {#if isStrategyCell($isUsingStrategy, $strategyGrid, $cursor)}",
    		ctx
    	});

    	return block;
    }

    // (22:8) {:else}
    function create_else_block$1(ctx) {
    	let span;
    	let t0_value = /*strategy*/ ctx[5].strategyDescription() + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(" +");
    			attr_dev(span, "class", "strategy-description-text svelte-15u9og0");
    			add_location(span, file$3, 22, 12, 1072);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$strategyGrid, $cursor*/ 12 && t0_value !== (t0_value = /*strategy*/ ctx[5].strategyDescription() + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(22:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:8) {#if index === $strategyGrid[$cursor.y][$cursor.x].strategies.length - 1}
    function create_if_block_1$1(ctx) {
    	let span;
    	let t_value = /*strategy*/ ctx[5].strategyDescription() + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "strategy-description-text svelte-15u9og0");
    			add_location(span, file$3, 20, 12, 965);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$strategyGrid, $cursor*/ 12 && t_value !== (t_value = /*strategy*/ ctx[5].strategyDescription() + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(20:8) {#if index === $strategyGrid[$cursor.y][$cursor.x].strategies.length - 1}",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#each $strategyGrid[$cursor.y][$cursor.x].strategies as strategy, index}
    function create_each_block$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*index*/ ctx[7] === /*$strategyGrid*/ ctx[2][/*$cursor*/ ctx[3].y][/*$cursor*/ ctx[3].x].strategies.length - 1) return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(19:4) {#each $strategyGrid[$cursor.y][$cursor.x].strategies as strategy, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let show_if = /*isStrategyCell*/ ctx[4](/*$isUsingStrategy*/ ctx[1], /*$strategyGrid*/ ctx[2], /*$cursor*/ ctx[3]);
    	let if_block_anchor;
    	let if_block = show_if && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$isUsingStrategy, $strategyGrid, $cursor*/ 14) show_if = /*isStrategyCell*/ ctx[4](/*$isUsingStrategy*/ ctx[1], /*$strategyGrid*/ ctx[2], /*$cursor*/ ctx[3]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let isUsingStrategy;

    	let $isUsingStrategy,
    		$$unsubscribe_isUsingStrategy = noop,
    		$$subscribe_isUsingStrategy = () => ($$unsubscribe_isUsingStrategy(), $$unsubscribe_isUsingStrategy = subscribe(isUsingStrategy, $$value => $$invalidate(1, $isUsingStrategy = $$value)), isUsingStrategy);

    	let $strategyGrid;
    	let $cursor;
    	validate_store(strategyGrid, 'strategyGrid');
    	component_subscribe($$self, strategyGrid, $$value => $$invalidate(2, $strategyGrid = $$value));
    	validate_store(cursor, 'cursor');
    	component_subscribe($$self, cursor, $$value => $$invalidate(3, $cursor = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_isUsingStrategy());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StrategyDescription', slots, []);

    	function isStrategyCell(isUsingStrategy, strategyGridStore, cursorStore) {
    		if (cursorStore.x === null || cursorStore.y === null) return false;
    		return isUsingStrategy && strategyGridStore[cursorStore.y][cursorStore.x].isUserCell() && strategyGridStore[cursorStore.y][cursorStore.x].strategies != null && strategyGridStore[cursorStore.y][cursorStore.x].strategies.length > 0;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StrategyDescription> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		strategyGrid,
    		strategyManager,
    		cursor,
    		isStrategyCell,
    		isUsingStrategy,
    		$isUsingStrategy,
    		$strategyGrid,
    		$cursor
    	});

    	$$self.$inject_state = $$props => {
    		if ('isUsingStrategy' in $$props) $$subscribe_isUsingStrategy($$invalidate(0, isUsingStrategy = $$props.isUsingStrategy));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$subscribe_isUsingStrategy($$invalidate(0, isUsingStrategy = strategyManager.getIsUsingStrategy()));
    	return [isUsingStrategy, $isUsingStrategy, $strategyGrid, $cursor, isStrategyCell];
    }

    class StrategyDescription extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StrategyDescription",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Controls/ActionBar/Timer.svelte generated by Svelte v3.49.0 */
    const file$4 = "src/components/Controls/ActionBar/Timer.svelte";

    // (14:3) {:else}
    function create_else_block$2(ctx) {
    	let path;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M6 3v18M18 3v18");
    			add_location(path, file$4, 14, 4, 809);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(14:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (12:3) {#if $gamePaused}
    function create_if_block_1$2(ctx) {
    	let path;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M18.19 9.61L9.01 3.48A2.87 2.87 0 004.54 5.88v12.25a2.87 2.87 0 004.47 2.39l9.18-6.12a2.87 2.87 0 000-4.78v0z");
    			add_location(path, file$4, 12, 4, 607);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(12:3) {#if $gamePaused}",
    		ctx
    	});

    	return block;
    }

    // (20:1) {#if $settings.displayTimer}
    function create_if_block$2(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*$timer*/ ctx[2]);
    			attr_dev(span, "class", "timer-text svelte-695amg");
    			attr_dev(span, "title", "Time");
    			add_location(span, file$4, 20, 2, 964);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$timer*/ 4) set_data_dev(t, /*$timer*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(20:1) {#if $settings.displayTimer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let button;
    	let svg;
    	let button_title_value;
    	let t0;
    	let t1;
    	let strategydescription;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$gamePaused*/ ctx[0]) return create_if_block_1$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*$settings*/ ctx[1].displayTimer && create_if_block$2(ctx);
    	strategydescription = new StrategyDescription({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			create_component(strategydescription.$$.fragment);
    			attr_dev(svg, "class", "icon-outline");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$4, 10, 2, 466);
    			attr_dev(button, "class", "btn btn-round");
    			attr_dev(button, "title", button_title_value = /*$gamePaused*/ ctx[0] ? 'Resume Game' : 'Pause Game');
    			add_location(button, file$4, 9, 1, 322);
    			attr_dev(div, "class", "timer-container svelte-695amg");
    			add_location(div, file$4, 8, 0, 291);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, svg);
    			if_block0.m(svg, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			insert_dev(target, t1, anchor);
    			mount_component(strategydescription, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(svg, null);
    				}
    			}

    			if (!current || dirty & /*$gamePaused*/ 1 && button_title_value !== (button_title_value = /*$gamePaused*/ ctx[0] ? 'Resume Game' : 'Pause Game')) {
    				attr_dev(button, "title", button_title_value);
    			}

    			if (/*$settings*/ ctx[1].displayTimer) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(strategydescription.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(strategydescription.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t1);
    			destroy_component(strategydescription, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $gamePaused;
    	let $settings;
    	let $timer;
    	validate_store(gamePaused, 'gamePaused');
    	component_subscribe($$self, gamePaused, $$value => $$invalidate(0, $gamePaused = $$value));
    	validate_store(settings, 'settings');
    	component_subscribe($$self, settings, $$value => $$invalidate(1, $settings = $$value));
    	validate_store(timer, 'timer');
    	component_subscribe($$self, timer, $$value => $$invalidate(2, $timer = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Timer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $gamePaused ? resumeGame() : pauseGame();

    	$$self.$capture_state = () => ({
    		timer,
    		pauseGame,
    		resumeGame,
    		gamePaused,
    		settings,
    		StrategyDescription,
    		$gamePaused,
    		$settings,
    		$timer
    	});

    	return [$gamePaused, $settings, $timer, click_handler];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    function createNotes() {
    	const notes = writable(false);

    	return {
    		subscribe: notes.subscribe,

    		toggle() {
    			notes.update($notes => !$notes);
    		}
    	}
    }

    const notes = createNotes();

    /* src/components/Controls/ActionBar/Actions.svelte generated by Svelte v3.49.0 */
    const file$5 = "src/components/Controls/ActionBar/Actions.svelte";

    // (59:8) {#if branchBackAvailable}
    function create_if_block_1$3(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*$branchBackTimes*/ ctx[0]);
    			attr_dev(span, "class", "badge badge-primary svelte-nwlpgt");
    			add_location(span, file$5, 59, 12, 2442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$branchBackTimes*/ 1) set_data_dev(t, /*$branchBackTimes*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(59:8) {#if branchBackAvailable}",
    		ctx
    	});

    	return block;
    }

    // (91:8) {#if $settings.hintsLimited}
    function create_if_block$3(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*$hints*/ ctx[1]);
    			attr_dev(span, "class", "badge svelte-nwlpgt");
    			toggle_class(span, "badge-primary", /*hintsAvailable*/ ctx[2]);
    			add_location(span, file$5, 91, 12, 4093);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$hints*/ 2) set_data_dev(t, /*$hints*/ ctx[1]);

    			if (dirty & /*hintsAvailable*/ 4) {
    				toggle_class(span, "badge-primary", /*hintsAvailable*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(91:8) {#if $settings.hintsLimited}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let button0;
    	let svg0;
    	let polyline;
    	let path0;
    	let t0;
    	let button0_disabled_value;
    	let t1;
    	let button1;
    	let svg1;
    	let path1;
    	let button1_disabled_value;
    	let t2;
    	let button2;
    	let svg2;
    	let path2;
    	let t3;
    	let button3;
    	let svg3;
    	let path3;
    	let t4;
    	let button3_disabled_value;
    	let button3_title_value;
    	let t5;
    	let button4;
    	let svg4;
    	let path4;
    	let t6;
    	let span;
    	let t7_value = (/*$notes*/ ctx[9] ? 'ON' : 'OFF') + "";
    	let t7;
    	let button4_title_value;
    	let mounted;
    	let dispose;
    	let if_block0 = /*branchBackAvailable*/ ctx[5] && create_if_block_1$3(ctx);
    	let if_block1 = /*$settings*/ ctx[8].hintsLimited && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			polyline = svg_element("polyline");
    			path0 = svg_element("path");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t2 = space();
    			button2 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t3 = space();
    			button3 = element("button");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			button4 = element("button");
    			svg4 = svg_element("svg");
    			path4 = svg_element("path");
    			t6 = space();
    			span = element("span");
    			t7 = text(t7_value);
    			attr_dev(polyline, "points", "1 4 1 10 7 10");
    			add_location(polyline, file$5, 54, 12, 2271);
    			attr_dev(path0, "d", "M3.51 15a9 9 0 1 0 2.13-9.36L1 10");
    			add_location(path0, file$5, 55, 12, 2328);
    			attr_dev(svg0, "class", "icon-outline");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "height", "24");
    			attr_dev(svg0, "stroke", "currentColor");
    			attr_dev(svg0, "stroke-linecap", "round");
    			attr_dev(svg0, "stroke-linejoin", "round");
    			attr_dev(svg0, "stroke-width", "2");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "width", "24");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$5, 51, 8, 2030);
    			attr_dev(button0, "class", "btn btn-round btn-badge svelte-nwlpgt");
    			button0.disabled = button0_disabled_value = !/*branchBackAvailable*/ ctx[5] || /*$gamePaused*/ ctx[7];
    			attr_dev(button0, "title", "ReturnBack");
    			add_location(button0, file$5, 49, 4, 1835);
    			attr_dev(path1, "d", "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6");
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			add_location(path1, file$5, 67, 12, 2859);
    			attr_dev(svg1, "class", "icon-outline");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$5, 65, 8, 2718);
    			attr_dev(button1, "class", "btn btn-round");
    			button1.disabled = button1_disabled_value = /*$gamePaused*/ ctx[7] || !/*returnToLastTimeStepAvailable*/ ctx[3];
    			attr_dev(button1, "title", "Undo");
    			add_location(button1, file$5, 63, 4, 2535);
    			attr_dev(path2, "d", "M21 10h-10a8 8 90 00-8 8v2M21 10l-6 6m6-6l-6-6");
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2");
    			add_location(path2, file$5, 75, 12, 3244);
    			attr_dev(svg2, "class", "icon-outline");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "stroke", "currentColor");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$5, 73, 8, 3103);
    			attr_dev(button2, "class", "btn btn-round");
    			button2.disabled = /*$gamePaused*/ ctx[7];
    			attr_dev(button2, "title", "Redo");
    			add_location(button2, file$5, 72, 4, 3028);
    			attr_dev(path3, "d", "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z");
    			attr_dev(path3, "stroke-linecap", "round");
    			attr_dev(path3, "stroke-linejoin", "round");
    			attr_dev(path3, "stroke-width", "2");
    			add_location(path3, file$5, 85, 12, 3707);
    			attr_dev(svg3, "class", "icon-outline");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "stroke", "currentColor");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg3, file$5, 83, 8, 3566);
    			attr_dev(button3, "class", "btn btn-round btn-badge svelte-nwlpgt");
    			button3.disabled = button3_disabled_value = !/*hintsAvailable*/ ctx[2];
    			attr_dev(button3, "title", button3_title_value = "Hints (" + /*$hints*/ ctx[1] + ")");
    			add_location(button3, file$5, 80, 4, 3419);
    			attr_dev(path4, "d", "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z");
    			attr_dev(path4, "stroke-linecap", "round");
    			attr_dev(path4, "stroke-linejoin", "round");
    			attr_dev(path4, "stroke-width", "2");
    			add_location(path4, file$5, 98, 12, 4453);
    			attr_dev(svg4, "class", "icon-outline");
    			attr_dev(svg4, "fill", "none");
    			attr_dev(svg4, "stroke", "currentColor");
    			attr_dev(svg4, "viewBox", "0 0 24 24");
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg4, file$5, 96, 8, 4312);
    			attr_dev(span, "class", "badge tracking-tighter svelte-nwlpgt");
    			toggle_class(span, "badge-primary", /*$notes*/ ctx[9]);
    			add_location(span, file$5, 103, 8, 4686);
    			attr_dev(button4, "class", "btn btn-round btn-badge svelte-nwlpgt");
    			attr_dev(button4, "title", button4_title_value = "Notes (" + (/*$notes*/ ctx[9] ? 'ON' : 'OFF') + ")");
    			add_location(button4, file$5, 95, 4, 4199);
    			attr_dev(div, "class", "action-buttons space-x-3 svelte-nwlpgt");
    			add_location(div, file$5, 47, 0, 1791);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, polyline);
    			append_dev(svg0, path0);
    			append_dev(button0, t0);
    			if (if_block0) if_block0.m(button0, null);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div, t2);
    			append_dev(div, button2);
    			append_dev(button2, svg2);
    			append_dev(svg2, path2);
    			append_dev(div, t3);
    			append_dev(div, button3);
    			append_dev(button3, svg3);
    			append_dev(svg3, path3);
    			append_dev(button3, t4);
    			if (if_block1) if_block1.m(button3, null);
    			append_dev(div, t5);
    			append_dev(div, button4);
    			append_dev(button4, svg4);
    			append_dev(svg4, path4);
    			append_dev(button4, t6);
    			append_dev(button4, span);
    			append_dev(span, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[13], false, false, false),
    					listen_dev(button3, "click", /*handleHint*/ ctx[10], false, false, false),
    					listen_dev(button4, "click", notes.toggle, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*branchBackAvailable*/ ctx[5]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$3(ctx);
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*branchBackAvailable, $gamePaused*/ 160 && button0_disabled_value !== (button0_disabled_value = !/*branchBackAvailable*/ ctx[5] || /*$gamePaused*/ ctx[7])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*$gamePaused, returnToLastTimeStepAvailable*/ 136 && button1_disabled_value !== (button1_disabled_value = /*$gamePaused*/ ctx[7] || !/*returnToLastTimeStepAvailable*/ ctx[3])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty & /*$gamePaused*/ 128) {
    				prop_dev(button2, "disabled", /*$gamePaused*/ ctx[7]);
    			}

    			if (/*$settings*/ ctx[8].hintsLimited) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					if_block1.m(button3, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*hintsAvailable*/ 4 && button3_disabled_value !== (button3_disabled_value = !/*hintsAvailable*/ ctx[2])) {
    				prop_dev(button3, "disabled", button3_disabled_value);
    			}

    			if (dirty & /*$hints*/ 2 && button3_title_value !== (button3_title_value = "Hints (" + /*$hints*/ ctx[1] + ")")) {
    				attr_dev(button3, "title", button3_title_value);
    			}

    			if (dirty & /*$notes*/ 512 && t7_value !== (t7_value = (/*$notes*/ ctx[9] ? 'ON' : 'OFF') + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*$notes*/ 512) {
    				toggle_class(span, "badge-primary", /*$notes*/ ctx[9]);
    			}

    			if (dirty & /*$notes*/ 512 && button4_title_value !== (button4_title_value = "Notes (" + (/*$notes*/ ctx[9] ? 'ON' : 'OFF') + ")")) {
    				attr_dev(button4, "title", button4_title_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let hintsAvailable;
    	let branchBackTimes;
    	let branchBackAvailable;
    	let timeStep;
    	let returnToLastTimeStepAvailable;
    	let $strategyGrid;
    	let $cursor;
    	let $candidates;

    	let $timeStep,
    		$$unsubscribe_timeStep = noop,
    		$$subscribe_timeStep = () => ($$unsubscribe_timeStep(), $$unsubscribe_timeStep = subscribe(timeStep, $$value => $$invalidate(11, $timeStep = $$value)), timeStep);

    	let $branchBackTimes,
    		$$unsubscribe_branchBackTimes = noop,
    		$$subscribe_branchBackTimes = () => ($$unsubscribe_branchBackTimes(), $$unsubscribe_branchBackTimes = subscribe(branchBackTimes, $$value => $$invalidate(0, $branchBackTimes = $$value)), branchBackTimes);

    	let $hints;
    	let $gamePaused;
    	let $settings;
    	let $notes;
    	validate_store(strategyGrid, 'strategyGrid');
    	component_subscribe($$self, strategyGrid, $$value => $$invalidate(14, $strategyGrid = $$value));
    	validate_store(cursor, 'cursor');
    	component_subscribe($$self, cursor, $$value => $$invalidate(15, $cursor = $$value));
    	validate_store(candidates, 'candidates');
    	component_subscribe($$self, candidates, $$value => $$invalidate(16, $candidates = $$value));
    	validate_store(hints, 'hints');
    	component_subscribe($$self, hints, $$value => $$invalidate(1, $hints = $$value));
    	validate_store(gamePaused, 'gamePaused');
    	component_subscribe($$self, gamePaused, $$value => $$invalidate(7, $gamePaused = $$value));
    	validate_store(settings, 'settings');
    	component_subscribe($$self, settings, $$value => $$invalidate(8, $settings = $$value));
    	validate_store(notes, 'notes');
    	component_subscribe($$self, notes, $$value => $$invalidate(9, $notes = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_timeStep());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_branchBackTimes());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Actions', slots, []);

    	function handleHint() {
    		if (hintsAvailable) {
    			if ($candidates.hasOwnProperty($cursor.x + ',' + $cursor.y)) {
    				candidates.clear($cursor);
    			}

    			if (get_store_value(strategyManager.getIsUsingStrategy()) && get_store_value(strategyManager.getIsGenerateSingleCandidate())) {
    				branchBackManager.getBranchBackTimes().update(val => val + 1);
    			}

    			strategyGrid.increaseTimeStep();
    			const strategyApplyCell = strategyManager.apply($strategyGrid);
    			strategyApplyCell.forEach(pos => strategyGrid.setCurrentCell(pos));
    			strategyGrid.updateCellCandidates();

    			// Update branch back manager
    			if (strategyApplyCell.length > 0) {
    				strategyManager.getIsUsingStrategy().set(true);

    				if (get_store_value(strategyManager.getIsGenerateSingleCandidate())) {
    					hints.useHint();
    					branchBackManager.addBranchBackTimeStep(get_store_value(strategyGrid.getTimeStep()));
    				}
    			} else {
    				strategyManager.getIsUsingStrategy().set(false);
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Actions> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => branchBackManager.branchBackToLastBranchTimeStep();
    	const click_handler_1 = () => branchBackManager.branchBackToLastTimeStep();

    	$$self.$capture_state = () => ({
    		candidates,
    		userGrid,
    		strategyGrid,
    		cursor,
    		hints,
    		notes,
    		settings,
    		gamePaused,
    		strategyManager,
    		branchBackManager,
    		get: get_store_value,
    		handleHint,
    		hintsAvailable,
    		returnToLastTimeStepAvailable,
    		timeStep,
    		branchBackAvailable,
    		branchBackTimes,
    		$strategyGrid,
    		$cursor,
    		$candidates,
    		$timeStep,
    		$branchBackTimes,
    		$hints,
    		$gamePaused,
    		$settings,
    		$notes
    	});

    	$$self.$inject_state = $$props => {
    		if ('hintsAvailable' in $$props) $$invalidate(2, hintsAvailable = $$props.hintsAvailable);
    		if ('returnToLastTimeStepAvailable' in $$props) $$invalidate(3, returnToLastTimeStepAvailable = $$props.returnToLastTimeStepAvailable);
    		if ('timeStep' in $$props) $$subscribe_timeStep($$invalidate(4, timeStep = $$props.timeStep));
    		if ('branchBackAvailable' in $$props) $$invalidate(5, branchBackAvailable = $$props.branchBackAvailable);
    		if ('branchBackTimes' in $$props) $$subscribe_branchBackTimes($$invalidate(6, branchBackTimes = $$props.branchBackTimes));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$hints*/ 2) {
    			 $$invalidate(2, hintsAvailable = $hints > 0);
    		}

    		if ($$self.$$.dirty & /*$branchBackTimes*/ 1) {
    			 $$invalidate(5, branchBackAvailable = $branchBackTimes > 0);
    		}

    		if ($$self.$$.dirty & /*$timeStep*/ 2048) {
    			 $$invalidate(3, returnToLastTimeStepAvailable = $timeStep > 1);
    		}
    	};

    	 $$subscribe_branchBackTimes($$invalidate(6, branchBackTimes = branchBackManager.getBranchBackTimes()));
    	 $$subscribe_timeStep($$invalidate(4, timeStep = strategyGrid.getTimeStep()));

    	return [
    		$branchBackTimes,
    		$hints,
    		hintsAvailable,
    		returnToLastTimeStepAvailable,
    		timeStep,
    		branchBackAvailable,
    		branchBackTimes,
    		$gamePaused,
    		$settings,
    		$notes,
    		handleHint,
    		$timeStep,
    		click_handler,
    		click_handler_1
    	];
    }

    class Actions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Actions",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Controls/ActionBar/index.svelte generated by Svelte v3.49.0 */
    const file$6 = "src/components/Controls/ActionBar/index.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let timer;
    	let t;
    	let actions;
    	let current;
    	timer = new Timer({ $$inline: true });
    	actions = new Actions({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(timer.$$.fragment);
    			t = space();
    			create_component(actions.$$.fragment);
    			attr_dev(div, "class", "action-bar space-y-3 xs:space-y-0 svelte-pbyid3");
    			add_location(div, file$6, 5, 0, 98);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(timer, div, null);
    			append_dev(div, t);
    			mount_component(actions, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timer.$$.fragment, local);
    			transition_in(actions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timer.$$.fragment, local);
    			transition_out(actions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(timer);
    			destroy_component(actions);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ActionBar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ActionBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Timer, Actions });
    	return [];
    }

    class ActionBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ActionBar",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const keyboardDisabled = derived(
    	[cursor, grid, gamePaused],
    	([$cursor, $grid, $gamePaused]) => {
    		return ($cursor.x === null && $cursor.y === null) || $grid[$cursor.y][$cursor.x] !== 0 || $gamePaused;
    	},
    	false,
    );

    /* src/components/Controls/Keyboard.svelte generated by Svelte v3.49.0 */
    const file$7 = "src/components/Controls/Keyboard.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (105:2) {:else}
    function create_else_block$3(ctx) {
    	let button;
    	let t0_value = /*keyNum*/ ctx[10] + 1 + "";
    	let t0;
    	let t1;
    	let button_title_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[4](/*keyNum*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "btn btn-key svelte-1lbwxsb");
    			button.disabled = /*$keyboardDisabled*/ ctx[0];
    			attr_dev(button, "title", button_title_value = "Insert " + (/*keyNum*/ ctx[10] + 1));
    			add_location(button, file$7, 105, 3, 2813);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$keyboardDisabled*/ 1) {
    				prop_dev(button, "disabled", /*$keyboardDisabled*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(105:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (99:2) {#if keyNum === 9}
    function create_if_block$4(ctx) {
    	let button;
    	let svg;
    	let path;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t = space();
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16");
    			add_location(path, file$7, 101, 5, 2574);
    			attr_dev(svg, "class", "icon-outline");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$7, 100, 4, 2453);
    			attr_dev(button, "class", "btn btn-key svelte-1lbwxsb");
    			button.disabled = /*$keyboardDisabled*/ ctx[0];
    			attr_dev(button, "title", "Erase Field");
    			add_location(button, file$7, 99, 3, 2335);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$keyboardDisabled*/ 1) {
    				prop_dev(button, "disabled", /*$keyboardDisabled*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(99:2) {#if keyNum === 9}",
    		ctx
    	});

    	return block;
    }

    // (98:1) {#each Array(10) as _, keyNum}
    function create_each_block$3(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*keyNum*/ ctx[10] === 9) return create_if_block$4;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(98:1) {#each Array(10) as _, keyNum}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let mounted;
    	let dispose;
    	let each_value = Array(10);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "keyboard-grid svelte-1lbwxsb");
    			add_location(div, file$7, 95, 0, 2250);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*handleKey*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$keyboardDisabled, handleKeyButton*/ 3) {
    				each_value = Array(10);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $cursor;
    	let $candidates;
    	let $notes;
    	let $keyboardDisabled;
    	validate_store(cursor, 'cursor');
    	component_subscribe($$self, cursor, $$value => $$invalidate(5, $cursor = $$value));
    	validate_store(candidates, 'candidates');
    	component_subscribe($$self, candidates, $$value => $$invalidate(6, $candidates = $$value));
    	validate_store(notes, 'notes');
    	component_subscribe($$self, notes, $$value => $$invalidate(7, $notes = $$value));
    	validate_store(keyboardDisabled, 'keyboardDisabled');
    	component_subscribe($$self, keyboardDisabled, $$value => $$invalidate(0, $keyboardDisabled = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Keyboard', slots, []);

    	function handleKeyButton(num) {
    		if (!$keyboardDisabled) {
    			if ($notes) {
    				if (num === 0) {
    					candidates.clear($cursor);
    				} else {
    					candidates.add($cursor, num);
    				}

    				userGrid.set($cursor, 0);
    			} else {
    				if ($candidates.hasOwnProperty($cursor.x + ',' + $cursor.y)) {
    					candidates.clear($cursor);
    				}

    				// userGrid.set($cursor, num);
    				if (get_store_value(strategyManager.getIsUsingStrategy())) {
    					branchBackManager.getBranchBackTimes().update(val => val + 1);
    				}

    				// Update strategy manager state
    				strategyManager.getIsUsingStrategy().set(false);

    				// Update strategy grid state
    				strategyGrid.increaseTimeStep();

    				get_store_value(strategyGrid.getStrategyGrid()).map(row => row.map(cell => {
    					cell.resetRelativePos();
    					cell.resetStrategies();
    				}));

    				strategyGrid.set(get_store_value(cursor), num);
    				strategyGrid.updateCellCandidates([get_store_value(cursor)]);
    			}
    		}
    	}

    	function handleKey(e) {
    		switch (e.key || e.keyCode) {
    			case 'ArrowUp':
    			case 38:
    			case 'w':
    			case 87:
    				cursor.move(0, -1);
    				break;
    			case 'ArrowDown':
    			case 40:
    			case 's':
    			case 83:
    				cursor.move(0, 1);
    				break;
    			case 'ArrowLeft':
    			case 37:
    			case 'a':
    			case 65:
    				cursor.move(-1);
    				break;
    			case 'ArrowRight':
    			case 39:
    			case 'd':
    			case 68:
    				cursor.move(1);
    				break;
    			case 'Backspace':
    			case 8:
    			case 'Delete':
    			case 46:
    				handleKeyButton(0);
    				break;
    			default:
    				if (e.key && e.key * 1 >= 0 && e.key * 1 < 10) {
    					handleKeyButton(e.key * 1);
    				} else if (e.keyCode - 48 >= 0 && e.keyCode - 48 < 10) {
    					handleKeyButton(e.keyCode - 48);
    				}
    				break;
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Keyboard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleKeyButton(0);
    	const click_handler_1 = keyNum => handleKeyButton(keyNum + 1);

    	$$self.$capture_state = () => ({
    		userGrid,
    		strategyGrid,
    		cursor,
    		notes,
    		candidates,
    		strategyManager,
    		branchBackManager,
    		keyboardDisabled,
    		get: get_store_value,
    		handleKeyButton,
    		handleKey,
    		$cursor,
    		$candidates,
    		$notes,
    		$keyboardDisabled
    	});

    	return [$keyboardDisabled, handleKeyButton, handleKey, click_handler, click_handler_1];
    }

    class Keyboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Keyboard",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/Controls/index.svelte generated by Svelte v3.49.0 */
    const file$8 = "src/components/Controls/index.svelte";

    function create_fragment$8(ctx) {
    	let div1;
    	let div0;
    	let actionbar;
    	let t;
    	let keyboard;
    	let current;
    	actionbar = new ActionBar({ $$inline: true });
    	keyboard = new Keyboard({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(actionbar.$$.fragment);
    			t = space();
    			create_component(keyboard.$$.fragment);
    			attr_dev(div0, "class", "w-full max-w-xl");
    			add_location(div0, file$8, 6, 1, 159);
    			attr_dev(div1, "class", "px-4 pb-5 flex justify-center");
    			add_location(div1, file$8, 5, 0, 114);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(actionbar, div0, null);
    			append_dev(div0, t);
    			mount_component(keyboard, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(actionbar.$$.fragment, local);
    			transition_in(keyboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(actionbar.$$.fragment, local);
    			transition_out(keyboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(actionbar);
    			destroy_component(keyboard);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Controls', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Controls> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ActionBar, Keyboard });
    	return [];
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controls",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/Header/Buttons.svelte generated by Svelte v3.49.0 */
    const file$9 = "src/components/Header/Buttons.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let button0;
    	let svg0;
    	let path0;
    	let t;
    	let button1;
    	let svg1;
    	let path1;
    	let path2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "2");
    			attr_dev(path0, "d", "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z");
    			add_location(path0, file$9, 19, 3, 585);
    			attr_dev(svg0, "class", "icon-outline");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file$9, 18, 2, 466);
    			attr_dev(button0, "class", "btn btn-header svelte-uqy408");
    			attr_dev(button0, "title", "Share this Sudoku puzzle");
    			add_location(button0, file$9, 17, 1, 370);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			attr_dev(path1, "d", "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z");
    			add_location(path1, file$9, 25, 3, 1121);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2");
    			attr_dev(path2, "d", "M15 12a3 3 0 11-6 0 3 3 0 016 0z");
    			add_location(path2, file$9, 26, 3, 1685);
    			attr_dev(svg1, "class", "icon-outline");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file$9, 24, 2, 1002);
    			attr_dev(button1, "class", "btn btn-header svelte-uqy408");
    			attr_dev(button1, "title", "Open Settings");
    			add_location(button1, file$9, 23, 1, 914);
    			attr_dev(div, "class", "flex justify-evenly space-x-3");
    			add_location(div, file$9, 15, 0, 324);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div, t);
    			append_dev(div, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, path2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handleShareButton*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*handleSettingsButton*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Buttons', slots, []);

    	function handleShareButton() {
    		pauseGame();
    		modal.show('share', { onHide: resumeGame });
    	}

    	function handleSettingsButton() {
    		pauseGame();
    		modal.show('settings', { onHide: resumeGame });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Buttons> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		modal,
    		pauseGame,
    		resumeGame,
    		handleShareButton,
    		handleSettingsButton
    	});

    	return [handleShareButton, handleSettingsButton];
    }

    class Buttons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttons",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/Header/Dropdown.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1 } = globals;
    const file$a = "src/components/Header/Dropdown.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i][0];
    	child_ctx[9] = list[i][1];
    	return child_ctx;
    }

    // (78:1) {#if dropdownVisible}
    function create_if_block$5(ctx) {
    	let button;
    	let button_transition;
    	let t0;
    	let div;
    	let t1;
    	let hr;
    	let t2;
    	let a0;
    	let svg0;
    	let path0;
    	let t3;
    	let span0;
    	let t5;
    	let a1;
    	let svg1;
    	let path1;
    	let path2;
    	let t6;
    	let span1;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = Object.entries(DIFFICULTIES);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			a0 = element("a");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t3 = space();
    			span0 = element("span");
    			span0.textContent = "Create Own";
    			t5 = space();
    			a1 = element("a");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t6 = space();
    			span1 = element("span");
    			span1.textContent = "Enter Code";
    			attr_dev(button, "class", "dropdown-overlay svelte-1akcn41");
    			attr_dev(button, "tabindex", "-1");
    			add_location(button, file$a, 78, 2, 2122);
    			attr_dev(hr, "class", "my-1");
    			add_location(hr, file$a, 91, 3, 2961);
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "d", "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z");
    			attr_dev(path0, "clip-rule", "evenodd");
    			add_location(path0, file$a, 95, 5, 3213);
    			attr_dev(svg0, "class", "icon-solid");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 20 20");
    			attr_dev(svg0, "fill", "currentColor");
    			add_location(svg0, file$a, 94, 4, 3108);
    			attr_dev(span0, "class", "align-middle");
    			add_location(span0, file$a, 98, 4, 3368);
    			attr_dev(a0, "class", "dropdown-item svelte-1akcn41");
    			attr_dev(a0, "href", "/create");
    			attr_dev(a0, "title", "Create your own Sudoku puzzle");
    			add_location(a0, file$a, 93, 3, 2983);
    			attr_dev(path1, "d", "M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z");
    			add_location(path1, file$a, 102, 5, 3669);
    			attr_dev(path2, "fill-rule", "evenodd");
    			attr_dev(path2, "d", "M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z");
    			attr_dev(path2, "clip-rule", "evenodd");
    			add_location(path2, file$a, 103, 5, 3765);
    			attr_dev(svg1, "class", "icon-solid");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 20 20");
    			attr_dev(svg1, "fill", "currentColor");
    			add_location(svg1, file$a, 101, 4, 3564);
    			attr_dev(span1, "class", "align-middle");
    			add_location(span1, file$a, 106, 4, 3921);
    			attr_dev(a1, "class", "dropdown-item svelte-1akcn41");
    			attr_dev(a1, "href", "/enter-code");
    			attr_dev(a1, "title", "Enter a Sudoku puzzle code from a friend");
    			add_location(a1, file$a, 100, 3, 3424);
    			attr_dev(div, "class", "dropdown-menu svelte-1akcn41");
    			add_location(div, file$a, 80, 2, 2254);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t1);
    			append_dev(div, hr);
    			append_dev(div, t2);
    			append_dev(div, a0);
    			append_dev(a0, svg0);
    			append_dev(svg0, path0);
    			append_dev(a0, t3);
    			append_dev(a0, span0);
    			append_dev(div, t5);
    			append_dev(div, a1);
    			append_dev(a1, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, path2);
    			append_dev(a1, t6);
    			append_dev(a1, span1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*hideDropdown*/ ctx[6], false, false, false),
    					listen_dev(a0, "click", prevent_default(/*handleCreateOwn*/ ctx[3]), false, true, false),
    					listen_dev(a1, "click", prevent_default(/*handleEnterCode*/ ctx[4]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*Object, DIFFICULTIES, handleDifficulty*/ 4) {
    				each_value = Object.entries(DIFFICULTIES);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: DROPDOWN_DURATION }, true);
    				button_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { duration: DROPDOWN_DURATION }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: DROPDOWN_DURATION }, false);
    			button_transition.run(0);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { duration: DROPDOWN_DURATION }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_transition) button_transition.end();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(78:1) {#if dropdownVisible}",
    		ctx
    	});

    	return block;
    }

    // (82:3) {#each Object.entries(DIFFICULTIES) as [difficultyValue, difficultyLabel]}
    function create_each_block$4(ctx) {
    	let a;
    	let svg;
    	let path;
    	let t0;
    	let span;
    	let t1_value = /*difficultyLabel*/ ctx[9] + "";
    	let t1;
    	let a_href_value;
    	let a_title_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*difficultyValue*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$a, 84, 6, 2699);
    			attr_dev(svg, "class", "icon-solid");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$a, 83, 5, 2593);
    			attr_dev(span, "class", "align-middle");
    			add_location(span, file$a, 87, 5, 2885);
    			attr_dev(a, "class", "dropdown-item svelte-1akcn41");
    			attr_dev(a, "href", a_href_value = "/difficulty-" + /*difficultyValue*/ ctx[8]);
    			attr_dev(a, "title", a_title_value = "Set difficulty to '" + /*difficultyLabel*/ ctx[9] + "'");
    			add_location(a, file$a, 82, 4, 2413);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, svg);
    			append_dev(svg, path);
    			append_dev(a, t0);
    			append_dev(a, span);
    			append_dev(span, t1);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(click_handler), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(82:3) {#each Object.entries(DIFFICULTIES) as [difficultyValue, difficultyLabel]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let button;
    	let svg;
    	let path;
    	let t0;
    	let span;

    	let t1_value = (/*$difficulty*/ ctx[1] === DIFFICULTY_CUSTOM
    	? 'Custom'
    	: DIFFICULTIES[/*$difficulty*/ ctx[1]]) + "";

    	let t1;
    	let button_title_value;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*dropdownVisible*/ ctx[0] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M4 8h16M4 16h12");
    			add_location(path, file$a, 71, 3, 1860);
    			attr_dev(svg, "class", "icon-outline mr-3");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$a, 70, 2, 1736);
    			attr_dev(span, "class", "text-2xl tracking-wider");
    			add_location(span, file$a, 74, 2, 1965);
    			attr_dev(button, "class", "dropdown-button svelte-1akcn41");
    			attr_dev(button, "title", button_title_value = "" + ((/*dropdownVisible*/ ctx[0] ? 'Close' : 'Open') + " Menu"));
    			add_location(button, file$a, 69, 1, 1594);
    			attr_dev(div, "class", "dropdown svelte-1akcn41");
    			add_location(div, file$a, 68, 0, 1570);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t0);
    			append_dev(button, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*dropdownVisible*/ ctx[0]
    						? /*hideDropdown*/ ctx[6]
    						: /*showDropdown*/ ctx[5])) (/*dropdownVisible*/ ctx[0]
    						? /*hideDropdown*/ ctx[6]
    						: /*showDropdown*/ ctx[5]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if ((!current || dirty & /*$difficulty*/ 2) && t1_value !== (t1_value = (/*$difficulty*/ ctx[1] === DIFFICULTY_CUSTOM
    			? 'Custom'
    			: DIFFICULTIES[/*$difficulty*/ ctx[1]]) + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty & /*dropdownVisible*/ 1 && button_title_value !== (button_title_value = "" + ((/*dropdownVisible*/ ctx[0] ? 'Close' : 'Open') + " Menu"))) {
    				attr_dev(button, "title", button_title_value);
    			}

    			if (/*dropdownVisible*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*dropdownVisible*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $difficulty;
    	validate_store(difficulty, 'difficulty');
    	component_subscribe($$self, difficulty, $$value => $$invalidate(1, $difficulty = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Dropdown', slots, []);
    	let dropdownVisible = false;

    	function handleDifficulty(difficultyValue) {
    		$$invalidate(0, dropdownVisible = false);
    		game.pause();

    		modal.show('confirm', {
    			title: 'New Game',
    			text: 'Start new game with difficulty "' + DIFFICULTIES[difficultyValue] + '"?',
    			button: 'Continue',
    			onHide: game.resume,
    			callback: () => {
    				game.startNew(difficultyValue);
    			}
    		});
    	}

    	function handleCreateOwn() {
    		$$invalidate(0, dropdownVisible = false);
    		game.pause();

    		modal.show('confirm', {
    			title: 'Create Own',
    			text: 'Switch to the creator mode to create your own Sudoku puzzle?',
    			button: 'Continue',
    			onHide: game.resume,
    			callback: () => {
    				
    			}, //game.startCreatorMode();
    			
    		});
    	}

    	function handleEnterCode() {
    		$$invalidate(0, dropdownVisible = false);
    		game.pause();

    		modal.show('prompt', {
    			title: 'Enter Code',
    			text: 'Please enter the code of the Sudoku puzzle you want to play:',
    			fontMono: true,
    			button: 'Start',
    			onHide: game.resume,
    			callback: value => {
    				game.startCustom(value);
    			},
    			validate: validateSencode
    		});
    	}

    	function showDropdown() {
    		$$invalidate(0, dropdownVisible = true);
    		game.pause();
    	}

    	function hideDropdown() {
    		$$invalidate(0, dropdownVisible = false);
    		setTimeout(game.resume, DROPDOWN_DURATION);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Dropdown> was created with unknown prop '${key}'`);
    	});

    	const click_handler = difficultyValue => handleDifficulty(difficultyValue);

    	$$self.$capture_state = () => ({
    		game,
    		validateSencode,
    		modal,
    		slide,
    		fade,
    		DIFFICULTIES,
    		DROPDOWN_DURATION,
    		DIFFICULTY_CUSTOM,
    		difficulty,
    		dropdownVisible,
    		handleDifficulty,
    		handleCreateOwn,
    		handleEnterCode,
    		showDropdown,
    		hideDropdown,
    		$difficulty
    	});

    	$$self.$inject_state = $$props => {
    		if ('dropdownVisible' in $$props) $$invalidate(0, dropdownVisible = $$props.dropdownVisible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		dropdownVisible,
    		$difficulty,
    		handleDifficulty,
    		handleCreateOwn,
    		handleEnterCode,
    		showDropdown,
    		hideDropdown,
    		click_handler
    	];
    }

    class Dropdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dropdown",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/Header/index.svelte generated by Svelte v3.49.0 */
    const file$b = "src/components/Header/index.svelte";

    function create_fragment$b(ctx) {
    	let div1;
    	let div0;
    	let nav;
    	let dropdown;
    	let t;
    	let buttons;
    	let current;
    	dropdown = new Dropdown({ $$inline: true });
    	buttons = new Buttons({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			nav = element("nav");
    			create_component(dropdown.$$.fragment);
    			t = space();
    			create_component(buttons.$$.fragment);
    			attr_dev(nav, "class", "flex flex-wrap items-center justify-between");
    			add_location(nav, file$b, 8, 2, 193);
    			attr_dev(div0, "class", "w-full max-w-xl");
    			add_location(div0, file$b, 6, 1, 160);
    			attr_dev(div1, "class", "px-4 py-4 flex justify-center text-white");
    			add_location(div1, file$b, 5, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, nav);
    			mount_component(dropdown, nav, null);
    			append_dev(nav, t);
    			mount_component(buttons, nav, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dropdown.$$.fragment, local);
    			transition_in(buttons.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dropdown.$$.fragment, local);
    			transition_out(buttons.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(dropdown);
    			destroy_component(buttons);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Buttons, Dropdown });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/Utils/Clipboard.svelte generated by Svelte v3.49.0 */

    const file$c = "src/components/Utils/Clipboard.svelte";

    function create_fragment$c(ctx) {
    	let textarea;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			textarea.readOnly = "readonly";
    			set_style(textarea, "position", "absolute");
    			set_style(textarea, "left", "-9999px");
    			add_location(textarea, file$c, 29, 0, 587);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			/*textarea_binding*/ ctx[2](textarea);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			/*textarea_binding*/ ctx[2](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Clipboard', slots, []);
    	let textArea;

    	const copyText = function (text) {
    		if (navigator.clipboard) return navigator.clipboard.writeText(text);
    		$$invalidate(0, textArea.value = text, textArea);

    		const selected = document.getSelection().rangeCount > 0
    		? document.getSelection().getRangeAt(0)
    		: false;

    		textArea.select();
    		let success = false;

    		try {
    			success = document.execCommand('copy');
    		} catch(e) {
    			
    		}

    		if (selected) {
    			document.getSelection().removeAllRanges();
    			document.getSelection().addRange(selected);
    		}

    		return success ? Promise.resolve() : Promise.reject();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Clipboard> was created with unknown prop '${key}'`);
    	});

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			textArea = $$value;
    			$$invalidate(0, textArea);
    		});
    	}

    	$$self.$capture_state = () => ({ textArea, copyText });

    	$$self.$inject_state = $$props => {
    		if ('textArea' in $$props) $$invalidate(0, textArea = $$props.textArea);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [textArea, copyText, textarea_binding];
    }

    class Clipboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { copyText: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clipboard",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get copyText() {
    		return this.$$.ctx[1];
    	}

    	set copyText(value) {
    		throw new Error("<Clipboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Modal/Types/Share.svelte generated by Svelte v3.49.0 */
    const file$d = "src/components/Modal/Types/Share.svelte";

    function create_fragment$d(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let svg0;
    	let path0;
    	let t2;
    	let div2;
    	let input;
    	let t3;
    	let button0;
    	let svg1;
    	let path1;
    	let t4;
    	let hr;
    	let t5;
    	let div3;
    	let a0;
    	let svg2;
    	let path2;
    	let t6;
    	let span0;
    	let t8;
    	let a1;
    	let svg3;
    	let path3;
    	let t9;
    	let span1;
    	let t11;
    	let a2;
    	let svg4;
    	let path4;
    	let t12;
    	let span2;
    	let t14;
    	let a3;
    	let svg5;
    	let path5;
    	let t15;
    	let span3;
    	let t17;
    	let button1;
    	let svg6;
    	let path6;
    	let t18;
    	let span4;
    	let t20;
    	let clipboard;
    	let updating_copyText;
    	let current;
    	let mounted;
    	let dispose;

    	function clipboard_copyText_binding(value) {
    		/*clipboard_copyText_binding*/ ctx[11](value);
    	}

    	let clipboard_props = {};

    	if (/*copyText*/ ctx[2] !== void 0) {
    		clipboard_props.copyText = /*copyText*/ ctx[2];
    	}

    	clipboard = new Clipboard({ props: clipboard_props, $$inline: true });
    	binding_callbacks.push(() => bind(clipboard, 'copyText', clipboard_copyText_binding));

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Share Sudoku";
    			t1 = space();
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t2 = space();
    			div2 = element("div");
    			input = element("input");
    			t3 = space();
    			button0 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t4 = space();
    			hr = element("hr");
    			t5 = space();
    			div3 = element("div");
    			a0 = element("a");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t6 = space();
    			span0 = element("span");
    			span0.textContent = "Copy Link";
    			t8 = space();
    			a1 = element("a");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t9 = space();
    			span1 = element("span");
    			span1.textContent = "Share on Twitter";
    			t11 = space();
    			a2 = element("a");
    			svg4 = svg_element("svg");
    			path4 = svg_element("path");
    			t12 = space();
    			span2 = element("span");
    			span2.textContent = "Share on Facebook";
    			t14 = space();
    			a3 = element("a");
    			svg5 = svg_element("svg");
    			path5 = svg_element("path");
    			t15 = space();
    			span3 = element("span");
    			span3.textContent = "Share by Email";
    			t17 = space();
    			button1 = element("button");
    			svg6 = svg_element("svg");
    			path6 = svg_element("path");
    			t18 = space();
    			span4 = element("span");
    			span4.textContent = "Share QR Code";
    			t20 = space();
    			create_component(clipboard.$$.fragment);
    			attr_dev(h1, "class", "text-3xl font-semibold leading-none");
    			add_location(h1, file$d, 48, 1, 1365);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "2");
    			attr_dev(path0, "d", "M6 18L18 6M6 6l12 12");
    			add_location(path0, file$d, 52, 3, 1604);
    			attr_dev(svg0, "class", "icon-outline");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file$d, 51, 2, 1485);
    			attr_dev(div0, "class", "cursor-pointer");
    			add_location(div0, file$d, 50, 1, 1433);
    			attr_dev(div1, "class", "flex justify-between items-center mb-6");
    			add_location(div1, file$d, 47, 0, 1311);
    			attr_dev(input, "class", "input code-field svelte-1jzyjqo");
    			attr_dev(input, "type", "text");
    			input.readOnly = true;
    			input.value = /*sencode*/ ctx[3];
    			add_location(input, file$d, 58, 1, 1757);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			attr_dev(path1, "d", "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3");
    			add_location(path1, file$d, 62, 3, 2042);
    			attr_dev(svg1, "class", "icon-outline");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file$d, 61, 2, 1923);
    			attr_dev(button0, "class", "btn btn-copy svelte-1jzyjqo");
    			add_location(button0, file$d, 60, 1, 1862);
    			attr_dev(div2, "class", "code-container svelte-1jzyjqo");
    			add_location(div2, file$d, 57, 0, 1727);
    			attr_dev(hr, "class", "my-8");
    			add_location(hr, file$d, 67, 0, 2304);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2");
    			attr_dev(path2, "d", "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1");
    			add_location(path2, file$d, 73, 3, 2570);
    			attr_dev(svg2, "class", "icon-outline mr-2");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke", "currentColor");
    			add_location(svg2, file$d, 72, 2, 2446);
    			add_location(span0, file$d, 76, 2, 2790);
    			attr_dev(a0, "href", /*link*/ ctx[4]);
    			attr_dev(a0, "class", "btn btn-small");
    			add_location(a0, file$d, 71, 1, 2365);
    			attr_dev(path3, "d", "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z");
    			add_location(path3, file$d, 81, 3, 3036);
    			attr_dev(svg3, "class", "icon-outline mr-2");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "fill", "currentColor");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "stroke", "none");
    			add_location(svg3, file$d, 80, 2, 2912);
    			add_location(span1, file$d, 84, 2, 3568);
    			attr_dev(a1, "href", /*twitterLink*/ ctx[7]);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "btn btn-share btn-share-twitter btn-small svelte-1jzyjqo");
    			add_location(a1, file$d, 79, 1, 2821);
    			attr_dev(path4, "d", "M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z");
    			add_location(path4, file$d, 89, 3, 3823);
    			attr_dev(svg4, "class", "icon-outline mr-2");
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg4, "fill", "currentColor");
    			attr_dev(svg4, "viewBox", "0 0 24 24");
    			attr_dev(svg4, "stroke", "none");
    			add_location(svg4, file$d, 88, 2, 3699);
    			add_location(span2, file$d, 92, 2, 3977);
    			attr_dev(a2, "href", /*facebookLink*/ ctx[6]);
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "btn btn-share btn-share-facebook btn-small svelte-1jzyjqo");
    			add_location(a2, file$d, 87, 1, 3606);
    			attr_dev(path5, "stroke-linecap", "round");
    			attr_dev(path5, "stroke-linejoin", "round");
    			attr_dev(path5, "stroke-width", "2");
    			attr_dev(path5, "d", "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z");
    			add_location(path5, file$d, 97, 3, 4202);
    			attr_dev(svg5, "class", "icon-outline mr-2");
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg5, "fill", "none");
    			attr_dev(svg5, "viewBox", "0 0 24 24");
    			attr_dev(svg5, "stroke", "currentColor");
    			add_location(svg5, file$d, 96, 2, 4078);
    			add_location(span3, file$d, 100, 2, 4392);
    			attr_dev(a3, "href", /*mailToLink*/ ctx[8]);
    			attr_dev(a3, "target", "_blank");
    			attr_dev(a3, "class", "btn btn-small");
    			add_location(a3, file$d, 95, 1, 4016);
    			attr_dev(path6, "stroke-linecap", "round");
    			attr_dev(path6, "stroke-linejoin", "round");
    			attr_dev(path6, "stroke-width", "2");
    			attr_dev(path6, "d", "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z");
    			add_location(path6, file$d, 105, 3, 4649);
    			attr_dev(svg6, "class", "icon-outline mr-2");
    			attr_dev(svg6, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg6, "fill", "none");
    			attr_dev(svg6, "viewBox", "0 0 24 24");
    			attr_dev(svg6, "stroke", "currentColor");
    			add_location(svg6, file$d, 104, 2, 4525);
    			add_location(span4, file$d, 108, 2, 5006);
    			attr_dev(button1, "class", "btn btn-small");
    			add_location(button1, file$d, 103, 1, 4428);
    			attr_dev(div3, "class", "flex flex-col space-y-2");
    			add_location(div3, file$d, 69, 0, 2325);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, input);
    			append_dev(div2, t3);
    			append_dev(div2, button0);
    			append_dev(button0, svg1);
    			append_dev(svg1, path1);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, a0);
    			append_dev(a0, svg2);
    			append_dev(svg2, path2);
    			append_dev(a0, t6);
    			append_dev(a0, span0);
    			append_dev(div3, t8);
    			append_dev(div3, a1);
    			append_dev(a1, svg3);
    			append_dev(svg3, path3);
    			append_dev(a1, t9);
    			append_dev(a1, span1);
    			append_dev(div3, t11);
    			append_dev(div3, a2);
    			append_dev(a2, svg4);
    			append_dev(svg4, path4);
    			append_dev(a2, t12);
    			append_dev(a2, span2);
    			append_dev(div3, t14);
    			append_dev(div3, a3);
    			append_dev(a3, svg5);
    			append_dev(svg5, path5);
    			append_dev(a3, t15);
    			append_dev(a3, span3);
    			append_dev(div3, t17);
    			append_dev(div3, button1);
    			append_dev(button1, svg6);
    			append_dev(svg6, path6);
    			append_dev(button1, t18);
    			append_dev(button1, span4);
    			insert_dev(target, t20, anchor);
    			mount_component(clipboard, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						div0,
    						"click",
    						function () {
    							if (is_function(/*hideModal*/ ctx[1])) /*hideModal*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(input, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*copyText*/ ctx[2](/*sencode*/ ctx[3]))) /*copyText*/ ctx[2](/*sencode*/ ctx[3]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						a0,
    						"click",
    						prevent_default(function () {
    							if (is_function(/*copyText*/ ctx[2](/*link*/ ctx[4]))) /*copyText*/ ctx[2](/*link*/ ctx[4]).apply(this, arguments);
    						}),
    						false,
    						true,
    						false
    					),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			const clipboard_changes = {};

    			if (!updating_copyText && dirty & /*copyText*/ 4) {
    				updating_copyText = true;
    				clipboard_changes.copyText = /*copyText*/ ctx[2];
    				add_flush_callback(() => updating_copyText = false);
    			}

    			clipboard.$set(clipboard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clipboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clipboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t20);
    			destroy_component(clipboard, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function select(element) {
    	element.select();
    	element.setSelectionRange(0, element.value.length);
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $grid;
    	validate_store(grid, 'grid');
    	component_subscribe($$self, grid, $$value => $$invalidate(12, $grid = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Share', slots, []);
    	let { data = {} } = $$props;
    	let { hideModal } = $$props;
    	const sencode = grid.getSencode($grid);
    	const link = BASE_URL + '#' + sencode;
    	const encodedLink = encodeURIComponent(link);
    	const facebookLink = 'https://www.facebook.com/sharer/sharer.php?u=' + encodedLink;
    	const twitterLink = 'https://twitter.com/intent/tweet?text=Check%20out%20this%20Sudoku%20puzzle!&url=' + encodedLink;
    	const mailToLink = 'mailto:?subject=A%20Sudoku%20puzzle%20for%20you&body=Here%27s%20a%20link%20to%20a%20Sudoku%20puzzle%20on%20sudoku.jonasgeiler.com%3A%0A%0A' + encodedLink;
    	let copyText;

    	onMount(() => {
    		let canShare = false;

    		const shareData = {
    			url: link,
    			title: 'Sudoku',
    			text: 'Create & play Sudoku puzzles for free online on sudoku.jonasgeiler.com!'
    		};

    		if ('share' in navigator) {
    			canShare = true;
    		}

    		if ('canShare' in navigator) {
    			canShare = navigator.canShare(shareData);
    		}

    		if (canShare) {
    			navigator.share(shareData);
    		}
    	});

    	const writable_props = ['data', 'hideModal'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Share> was created with unknown prop '${key}'`);
    	});

    	const click_handler = e => select(e.target);
    	const click_handler_1 = () => modal.show('qrcode', { ...data, encodedLink });

    	function clipboard_copyText_binding(value) {
    		copyText = value;
    		$$invalidate(2, copyText);
    	}

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('hideModal' in $$props) $$invalidate(1, hideModal = $$props.hideModal);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		BASE_URL,
    		modal,
    		grid,
    		Clipboard,
    		data,
    		hideModal,
    		sencode,
    		link,
    		encodedLink,
    		facebookLink,
    		twitterLink,
    		mailToLink,
    		copyText,
    		select,
    		$grid
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('hideModal' in $$props) $$invalidate(1, hideModal = $$props.hideModal);
    		if ('copyText' in $$props) $$invalidate(2, copyText = $$props.copyText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		data,
    		hideModal,
    		copyText,
    		sencode,
    		link,
    		encodedLink,
    		facebookLink,
    		twitterLink,
    		mailToLink,
    		click_handler,
    		click_handler_1,
    		clipboard_copyText_binding
    	];
    }

    class Share extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { data: 0, hideModal: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Share",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hideModal*/ ctx[1] === undefined && !('hideModal' in props)) {
    			console.warn("<Share> was created without expected prop 'hideModal'");
    		}
    	}

    	get data() {
    		throw new Error("<Share>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Share>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideModal() {
    		throw new Error("<Share>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideModal(value) {
    		throw new Error("<Share>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Modal/Types/QRCode.svelte generated by Svelte v3.49.0 */
    const file$e = "src/components/Modal/Types/QRCode.svelte";

    function create_fragment$e(ctx) {
    	let img;
    	let img_src_value;
    	let t0;
    	let div;
    	let button;
    	let svg;
    	let path;
    	let t1;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t1 = space();
    			span = element("span");
    			span.textContent = "Back";
    			attr_dev(img, "class", "h-full w-full");
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			add_location(img, file$e, 13, 0, 399);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M15 19l-7-7 7-7");
    			add_location(path, file$e, 18, 3, 669);
    			attr_dev(svg, "class", "icon-outline mr-2");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$e, 17, 2, 545);
    			add_location(span, file$e, 21, 2, 774);
    			attr_dev(button, "class", "btn btn-small w-full");
    			add_location(button, file$e, 16, 1, 462);
    			attr_dev(div, "class", "mt-3");
    			add_location(div, file$e, 15, 0, 442);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(button, t1);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function select$1(element) {
    	element.select();
    	element.setSelectionRange(0, element.value.length);
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('QRCode', slots, []);
    	let { data = {} } = $$props;
    	const image = 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&charset-source=UTF-8&charset-target=UTF-8&ecc=L&color=000&bgcolor=f7f9fc&margin=8&qzone=0&format=png&data=' + data.encodedLink;
    	const writable_props = ['data'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<QRCode> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => modal.show('share', data);

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ modal, data, image, select: select$1 });

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, image, click_handler];
    }

    class QRCode extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QRCode",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get data() {
    		throw new Error("<QRCode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<QRCode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Utils/Switch.svelte generated by Svelte v3.49.0 */

    const file$f = "src/components/Utils/Switch.svelte";

    function create_fragment$f(ctx) {
    	let label;
    	let span0;
    	let t0;
    	let t1;
    	let span3;
    	let input;
    	let t2;
    	let span1;
    	let t3;
    	let span2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			span0 = element("span");
    			t0 = text(/*text*/ ctx[2]);
    			t1 = space();
    			span3 = element("span");
    			input = element("input");
    			t2 = space();
    			span1 = element("span");
    			t3 = space();
    			span2 = element("span");
    			attr_dev(span0, "class", "flex-grow cursor-pointer text-lg");
    			add_location(span0, file$f, 8, 1, 176);
    			attr_dev(input, "id", /*id*/ ctx[1]);
    			attr_dev(input, "name", /*id*/ ctx[1]);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "sr-only svelte-16q4h9h");
    			input.disabled = /*disabled*/ ctx[3];
    			add_location(input, file$f, 11, 2, 263);
    			attr_dev(span1, "class", "track svelte-16q4h9h");
    			add_location(span1, file$f, 12, 2, 348);
    			attr_dev(span2, "class", "thumb svelte-16q4h9h");
    			add_location(span2, file$f, 13, 2, 378);
    			attr_dev(span3, "class", "switch svelte-16q4h9h");
    			add_location(span3, file$f, 10, 1, 239);
    			attr_dev(label, "for", /*id*/ ctx[1]);
    			attr_dev(label, "class", "inline-flex items-center");
    			add_location(label, file$f, 7, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, span0);
    			append_dev(span0, t0);
    			append_dev(label, t1);
    			append_dev(label, span3);
    			append_dev(span3, input);
    			input.checked = /*checked*/ ctx[0];
    			append_dev(span3, t2);
    			append_dev(span3, span1);
    			append_dev(span3, t3);
    			append_dev(span3, span2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 4) set_data_dev(t0, /*text*/ ctx[2]);

    			if (dirty & /*id*/ 2) {
    				attr_dev(input, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*id*/ 2) {
    				attr_dev(input, "name", /*id*/ ctx[1]);
    			}

    			if (dirty & /*disabled*/ 8) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[3]);
    			}

    			if (dirty & /*checked*/ 1) {
    				input.checked = /*checked*/ ctx[0];
    			}

    			if (dirty & /*id*/ 2) {
    				attr_dev(label, "for", /*id*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Switch', slots, []);
    	let { id = '' } = $$props;
    	let { text = '' } = $$props;
    	let { checked = false } = $$props;
    	let { disabled = false } = $$props;
    	const writable_props = ['id', 'text', 'checked', 'disabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Switch> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('checked' in $$props) $$invalidate(0, checked = $$props.checked);
    		if ('disabled' in $$props) $$invalidate(3, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({ id, text, checked, disabled });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('checked' in $$props) $$invalidate(0, checked = $$props.checked);
    		if ('disabled' in $$props) $$invalidate(3, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [checked, id, text, disabled, input_change_handler];
    }

    class Switch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { id: 1, text: 2, checked: 0, disabled: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Switch",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get id() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Modal/Types/Settings.svelte generated by Svelte v3.49.0 */
    const file$g = "src/components/Modal/Types/Settings.svelte";

    // (42:1) {#if hintsLimited}
    function create_if_block$6(ctx) {
    	let div;
    	let label;
    	let t1;
    	let input;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			label.textContent = "Number of available hints";
    			t1 = space();
    			input = element("input");
    			attr_dev(label, "for", "hints");
    			attr_dev(label, "class", "flex-grow text-lg");
    			add_location(label, file$g, 43, 3, 1223);
    			attr_dev(input, "class", "number-input svelte-1t81v8m");
    			attr_dev(input, "id", "hints");
    			attr_dev(input, "name", "hints");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "81");
    			add_location(input, file$g, 45, 3, 1306);
    			attr_dev(div, "class", "inline-flex items-center");
    			add_location(div, file$g, 42, 2, 1164);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t1);
    			append_dev(div, input);
    			set_input_value(input, /*settings*/ ctx[1].hints);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[7]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 2 && to_number(input.value) !== /*settings*/ ctx[1].hints) {
    				set_input_value(input, /*settings*/ ctx[1].hints);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(42:1) {#if hintsLimited}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let h1;
    	let t1;
    	let div0;
    	let switch0;
    	let updating_checked;
    	let t2;
    	let switch1;
    	let updating_checked_1;
    	let t3;
    	let t4;
    	let switch2;
    	let updating_checked_2;
    	let t5;
    	let switch3;
    	let updating_checked_3;
    	let t6;
    	let switch4;
    	let updating_checked_4;
    	let t7;
    	let div1;
    	let button0;
    	let t9;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	function switch0_checked_binding(value) {
    		/*switch0_checked_binding*/ ctx[5](value);
    	}

    	let switch0_props = {
    		text: "Display timer while playing",
    		id: "display-timer"
    	};

    	if (/*settings*/ ctx[1].displayTimer !== void 0) {
    		switch0_props.checked = /*settings*/ ctx[1].displayTimer;
    	}

    	switch0 = new Switch({ props: switch0_props, $$inline: true });
    	binding_callbacks.push(() => bind(switch0, 'checked', switch0_checked_binding));

    	function switch1_checked_binding(value) {
    		/*switch1_checked_binding*/ ctx[6](value);
    	}

    	let switch1_props = {
    		text: "Limit the number of hints available",
    		id: "hints-limited"
    	};

    	if (/*hintsLimited*/ ctx[2] !== void 0) {
    		switch1_props.checked = /*hintsLimited*/ ctx[2];
    	}

    	switch1 = new Switch({ props: switch1_props, $$inline: true });
    	binding_callbacks.push(() => bind(switch1, 'checked', switch1_checked_binding));
    	let if_block = /*hintsLimited*/ ctx[2] && create_if_block$6(ctx);

    	function switch2_checked_binding(value) {
    		/*switch2_checked_binding*/ ctx[8](value);
    	}

    	let switch2_props = {
    		text: "Highlight cells in same row/column/box",
    		id: "highlight-cells"
    	};

    	if (/*settings*/ ctx[1].highlightCells !== void 0) {
    		switch2_props.checked = /*settings*/ ctx[1].highlightCells;
    	}

    	switch2 = new Switch({ props: switch2_props, $$inline: true });
    	binding_callbacks.push(() => bind(switch2, 'checked', switch2_checked_binding));

    	function switch3_checked_binding(value) {
    		/*switch3_checked_binding*/ ctx[9](value);
    	}

    	let switch3_props = {
    		text: "Highlight cells with the same number",
    		id: "highlight-matching"
    	};

    	if (/*settings*/ ctx[1].highlightSame !== void 0) {
    		switch3_props.checked = /*settings*/ ctx[1].highlightSame;
    	}

    	switch3 = new Switch({ props: switch3_props, $$inline: true });
    	binding_callbacks.push(() => bind(switch3, 'checked', switch3_checked_binding));

    	function switch4_checked_binding(value) {
    		/*switch4_checked_binding*/ ctx[10](value);
    	}

    	let switch4_props = {
    		text: "Highlight conflicting numbers",
    		id: "highlight-conflicting"
    	};

    	if (/*settings*/ ctx[1].highlightConflicting !== void 0) {
    		switch4_props.checked = /*settings*/ ctx[1].highlightConflicting;
    	}

    	switch4 = new Switch({ props: switch4_props, $$inline: true });
    	binding_callbacks.push(() => bind(switch4, 'checked', switch4_checked_binding));

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Settings";
    			t1 = space();
    			div0 = element("div");
    			create_component(switch0.$$.fragment);
    			t2 = space();
    			create_component(switch1.$$.fragment);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();
    			create_component(switch2.$$.fragment);
    			t5 = space();
    			create_component(switch3.$$.fragment);
    			t6 = space();
    			create_component(switch4.$$.fragment);
    			t7 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Cancel";
    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "Save";
    			attr_dev(h1, "class", "text-3xl font-semibold mb-6 leading-none");
    			add_location(h1, file$g, 24, 0, 587);
    			attr_dev(div0, "class", "flex flex-col mb-6 space-y-3");
    			add_location(div0, file$g, 36, 0, 799);
    			attr_dev(button0, "class", "btn btn-small mr-3");
    			add_location(button0, file$g, 55, 1, 1834);
    			attr_dev(button1, "class", "btn btn-small btn-primary");
    			add_location(button1, file$g, 56, 1, 1907);
    			attr_dev(div1, "class", "flex justify-end");
    			add_location(div1, file$g, 54, 0, 1802);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			mount_component(switch0, div0, null);
    			append_dev(div0, t2);
    			mount_component(switch1, div0, null);
    			append_dev(div0, t3);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div0, t4);
    			mount_component(switch2, div0, null);
    			append_dev(div0, t5);
    			mount_component(switch3, div0, null);
    			append_dev(div0, t6);
    			mount_component(switch4, div0, null);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(div1, t9);
    			append_dev(div1, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*hideModal*/ ctx[0])) /*hideModal*/ ctx[0].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*handleSave*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			const switch0_changes = {};

    			if (!updating_checked && dirty & /*settings*/ 2) {
    				updating_checked = true;
    				switch0_changes.checked = /*settings*/ ctx[1].displayTimer;
    				add_flush_callback(() => updating_checked = false);
    			}

    			switch0.$set(switch0_changes);
    			const switch1_changes = {};

    			if (!updating_checked_1 && dirty & /*hintsLimited*/ 4) {
    				updating_checked_1 = true;
    				switch1_changes.checked = /*hintsLimited*/ ctx[2];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			switch1.$set(switch1_changes);

    			if (/*hintsLimited*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*hintsLimited*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, t4);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const switch2_changes = {};

    			if (!updating_checked_2 && dirty & /*settings*/ 2) {
    				updating_checked_2 = true;
    				switch2_changes.checked = /*settings*/ ctx[1].highlightCells;
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			switch2.$set(switch2_changes);
    			const switch3_changes = {};

    			if (!updating_checked_3 && dirty & /*settings*/ 2) {
    				updating_checked_3 = true;
    				switch3_changes.checked = /*settings*/ ctx[1].highlightSame;
    				add_flush_callback(() => updating_checked_3 = false);
    			}

    			switch3.$set(switch3_changes);
    			const switch4_changes = {};

    			if (!updating_checked_4 && dirty & /*settings*/ 2) {
    				updating_checked_4 = true;
    				switch4_changes.checked = /*settings*/ ctx[1].highlightConflicting;
    				add_flush_callback(() => updating_checked_4 = false);
    			}

    			switch4.$set(switch4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(switch0.$$.fragment, local);
    			transition_in(switch1.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(switch2.$$.fragment, local);
    			transition_in(switch3.$$.fragment, local);
    			transition_in(switch4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(switch0.$$.fragment, local);
    			transition_out(switch1.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(switch2.$$.fragment, local);
    			transition_out(switch3.$$.fragment, local);
    			transition_out(switch4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			destroy_component(switch0);
    			destroy_component(switch1);
    			if (if_block) if_block.d();
    			destroy_component(switch2);
    			destroy_component(switch3);
    			destroy_component(switch4);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $settingsStore;
    	validate_store(settings, 'settingsStore');
    	component_subscribe($$self, settings, $$value => $$invalidate(11, $settingsStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let { data = {} } = $$props;
    	let { hideModal } = $$props;
    	let settings$1 = { ...$settingsStore };
    	let hintsLimited = settings$1.hintsLimited;

    	function handleSave() {
    		$$invalidate(1, settings$1.hintsLimited = hintsLimited, settings$1);
    		if (settings$1.hints < 0) $$invalidate(1, settings$1.hints = 0, settings$1);
    		if (settings$1.hints > MAX_HINTS) $$invalidate(1, settings$1.hints = MAX_HINTS, settings$1);
    		settings.set(settings$1);
    		hideModal();
    	}

    	const writable_props = ['data', 'hideModal'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function switch0_checked_binding(value) {
    		if ($$self.$$.not_equal(settings$1.displayTimer, value)) {
    			settings$1.displayTimer = value;
    			$$invalidate(1, settings$1);
    		}
    	}

    	function switch1_checked_binding(value) {
    		hintsLimited = value;
    		$$invalidate(2, hintsLimited);
    	}

    	function input_input_handler() {
    		settings$1.hints = to_number(this.value);
    		$$invalidate(1, settings$1);
    	}

    	function switch2_checked_binding(value) {
    		if ($$self.$$.not_equal(settings$1.highlightCells, value)) {
    			settings$1.highlightCells = value;
    			$$invalidate(1, settings$1);
    		}
    	}

    	function switch3_checked_binding(value) {
    		if ($$self.$$.not_equal(settings$1.highlightSame, value)) {
    			settings$1.highlightSame = value;
    			$$invalidate(1, settings$1);
    		}
    	}

    	function switch4_checked_binding(value) {
    		if ($$self.$$.not_equal(settings$1.highlightConflicting, value)) {
    			settings$1.highlightConflicting = value;
    			$$invalidate(1, settings$1);
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(4, data = $$props.data);
    		if ('hideModal' in $$props) $$invalidate(0, hideModal = $$props.hideModal);
    	};

    	$$self.$capture_state = () => ({
    		slide,
    		Switch,
    		settingsStore: settings,
    		MAX_HINTS,
    		data,
    		hideModal,
    		settings: settings$1,
    		hintsLimited,
    		handleSave,
    		$settingsStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(4, data = $$props.data);
    		if ('hideModal' in $$props) $$invalidate(0, hideModal = $$props.hideModal);
    		if ('settings' in $$props) $$invalidate(1, settings$1 = $$props.settings);
    		if ('hintsLimited' in $$props) $$invalidate(2, hintsLimited = $$props.hintsLimited);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		hideModal,
    		settings$1,
    		hintsLimited,
    		handleSave,
    		data,
    		switch0_checked_binding,
    		switch1_checked_binding,
    		input_input_handler,
    		switch2_checked_binding,
    		switch3_checked_binding,
    		switch4_checked_binding
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { data: 4, hideModal: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hideModal*/ ctx[0] === undefined && !('hideModal' in props)) {
    			console.warn("<Settings> was created without expected prop 'hideModal'");
    		}
    	}

    	get data() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideModal() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideModal(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Modal/Types/Confirm.svelte generated by Svelte v3.49.0 */

    const file$h = "src/components/Modal/Types/Confirm.svelte";

    // (13:0) {#if data.text}
    function create_if_block$7(ctx) {
    	let p;
    	let t_value = /*data*/ ctx[0].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "text-lg mb-5");
    			add_location(p, file$h, 13, 1, 254);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*data*/ ctx[0].text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(13:0) {#if data.text}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let h1;
    	let t0_value = (/*data*/ ctx[0].title || 'Confirm') + "";
    	let t0;
    	let t1;
    	let t2;
    	let div;
    	let button0;
    	let t4;
    	let button1;
    	let t5_value = (/*data*/ ctx[0].button || 'Okay') + "";
    	let t5;
    	let mounted;
    	let dispose;
    	let if_block = /*data*/ ctx[0].text && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Cancel";
    			t4 = space();
    			button1 = element("button");
    			t5 = text(t5_value);
    			attr_dev(h1, "class", "text-3xl font-semibold mb-5 leading-none");
    			add_location(h1, file$h, 10, 0, 152);
    			attr_dev(button0, "class", "btn btn-small mr-3");
    			add_location(button0, file$h, 17, 1, 333);
    			attr_dev(button1, "class", "btn btn-small btn-primary");
    			add_location(button1, file$h, 18, 1, 406);
    			attr_dev(div, "class", "flex justify-end");
    			add_location(div, file$h, 16, 0, 301);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t4);
    			append_dev(div, button1);
    			append_dev(button1, t5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*hideModal*/ ctx[1])) /*hideModal*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*handleContinue*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = (/*data*/ ctx[0].title || 'Confirm') + "")) set_data_dev(t0, t0_value);

    			if (/*data*/ ctx[0].text) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*data*/ 1 && t5_value !== (t5_value = (/*data*/ ctx[0].button || 'Okay') + "")) set_data_dev(t5, t5_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Confirm', slots, []);
    	let { data = {} } = $$props;
    	let { hideModal } = $$props;

    	function handleContinue() {
    		if (data.callback) data.callback();
    		hideModal();
    	}

    	const writable_props = ['data', 'hideModal'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Confirm> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('hideModal' in $$props) $$invalidate(1, hideModal = $$props.hideModal);
    	};

    	$$self.$capture_state = () => ({ data, hideModal, handleContinue });

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('hideModal' in $$props) $$invalidate(1, hideModal = $$props.hideModal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, hideModal, handleContinue];
    }

    class Confirm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { data: 0, hideModal: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Confirm",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hideModal*/ ctx[1] === undefined && !('hideModal' in props)) {
    			console.warn("<Confirm> was created without expected prop 'hideModal'");
    		}
    	}

    	get data() {
    		throw new Error("<Confirm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Confirm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideModal() {
    		throw new Error("<Confirm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideModal(value) {
    		throw new Error("<Confirm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Modal/Types/Prompt.svelte generated by Svelte v3.49.0 */

    const file$i = "src/components/Modal/Types/Prompt.svelte";

    // (15:0) {#if data.text}
    function create_if_block$8(ctx) {
    	let label;
    	let t_value = /*data*/ ctx[0].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t = text(t_value);
    			attr_dev(label, "for", "prompt-input");
    			attr_dev(label, "class", "text-lg mb-4");
    			add_location(label, file$i, 15, 1, 290);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*data*/ ctx[0].text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(15:0) {#if data.text}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let h1;
    	let t0_value = (/*data*/ ctx[0].title || 'Please enter something') + "";
    	let t0;
    	let t1;
    	let t2;
    	let input;
    	let t3;
    	let div;
    	let button0;
    	let t5;
    	let button1;
    	let t6_value = (/*data*/ ctx[0].button || 'Okay') + "";
    	let t6;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;
    	let if_block = /*data*/ ctx[0].text && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Cancel";
    			t5 = space();
    			button1 = element("button");
    			t6 = text(t6_value);
    			attr_dev(h1, "class", "text-3xl font-semibold mb-5 leading-none");
    			add_location(h1, file$i, 12, 0, 173);
    			attr_dev(input, "class", "input mb-5");
    			attr_dev(input, "id", "prompt-input");
    			attr_dev(input, "name", "prompt-input");
    			attr_dev(input, "type", "text");
    			toggle_class(input, "font-mono", /*data*/ ctx[0].fontMono);
    			add_location(input, file$i, 18, 0, 364);
    			attr_dev(button0, "class", "btn btn-small mr-3");
    			add_location(button0, file$i, 21, 1, 517);
    			attr_dev(button1, "class", "btn btn-small btn-primary");

    			button1.disabled = button1_disabled_value = /*data*/ ctx[0].validate
    			? !/*data*/ ctx[0].validate(/*value*/ ctx[2])
    			: false;

    			add_location(button1, file$i, 22, 1, 590);
    			attr_dev(div, "class", "flex justify-end");
    			add_location(div, file$i, 20, 0, 485);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[2]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t5);
    			append_dev(div, button1);
    			append_dev(button1, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*hideModal*/ ctx[1])) /*hideModal*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*handleButton*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = (/*data*/ ctx[0].title || 'Please enter something') + "")) set_data_dev(t0, t0_value);

    			if (/*data*/ ctx[0].text) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*value*/ 4 && input.value !== /*value*/ ctx[2]) {
    				set_input_value(input, /*value*/ ctx[2]);
    			}

    			if (dirty & /*data*/ 1) {
    				toggle_class(input, "font-mono", /*data*/ ctx[0].fontMono);
    			}

    			if (dirty & /*data*/ 1 && t6_value !== (t6_value = (/*data*/ ctx[0].button || 'Okay') + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*data, value*/ 5 && button1_disabled_value !== (button1_disabled_value = /*data*/ ctx[0].validate
    			? !/*data*/ ctx[0].validate(/*value*/ ctx[2])
    			: false)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Prompt', slots, []);
    	let { data = {} } = $$props;
    	let { hideModal } = $$props;
    	let value = '';

    	function handleButton() {
    		if (data.callback) data.callback(value);
    		hideModal();
    	}

    	const writable_props = ['data', 'hideModal'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Prompt> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(2, value);
    	}

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('hideModal' in $$props) $$invalidate(1, hideModal = $$props.hideModal);
    	};

    	$$self.$capture_state = () => ({ data, hideModal, value, handleButton });

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('hideModal' in $$props) $$invalidate(1, hideModal = $$props.hideModal);
    		if ('value' in $$props) $$invalidate(2, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, hideModal, value, handleButton, input_input_handler];
    }

    class Prompt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { data: 0, hideModal: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prompt",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hideModal*/ ctx[1] === undefined && !('hideModal' in props)) {
    			console.warn("<Prompt> was created without expected prop 'hideModal'");
    		}
    	}

    	get data() {
    		throw new Error("<Prompt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Prompt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideModal() {
    		throw new Error("<Prompt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideModal(value) {
    		throw new Error("<Prompt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Modal/Types/Welcome.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1$1 } = globals;
    const file$j = "src/components/Modal/Types/Welcome.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i][0];
    	child_ctx[11] = list[i][1];
    	return child_ctx;
    }

    // (29:0) {#if data.sencode}
    function create_if_block$9(ctx) {
    	let div;
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Someone shared a Sudoku puzzle with you!");
    			br = element("br");
    			t1 = text("Just click start if you want to play it");
    			add_location(br, file$j, 30, 42, 915);
    			attr_dev(div, "class", "p-3 text-lg rounded bg-primary bg-opacity-25 border-l-8 border-primary border-opacity-75 mb-4");
    			add_location(div, file$j, 29, 1, 765);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, br);
    			append_dev(div, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(29:0) {#if data.sencode}",
    		ctx
    	});

    	return block;
    }

    // (39:2) {#each Object.entries(DIFFICULTIES) as [difficultyValue, difficultyLabel]}
    function create_each_block$5(ctx) {
    	let option;
    	let t_value = /*difficultyLabel*/ ctx[11] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*difficultyValue*/ ctx[10];
    			option.value = option.__value;
    			add_location(option, file$j, 39, 3, 1323);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(39:2) {#each Object.entries(DIFFICULTIES) as [difficultyValue, difficultyLabel]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let h1;
    	let t1;
    	let t2;
    	let label0;
    	let t4;
    	let div1;
    	let select;
    	let t5;
    	let div0;
    	let svg;
    	let path;
    	let t6;
    	let label1;
    	let t8;
    	let input;
    	let t9;
    	let div2;
    	let button;
    	let t10;
    	let mounted;
    	let dispose;
    	let if_block = /*data*/ ctx[0].sencode && create_if_block$9(ctx);
    	let each_value = Object.entries(DIFFICULTIES);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Welcome!";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			label0 = element("label");
    			label0.textContent = "To start a game, choose a difficulty:";
    			t4 = space();
    			div1 = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t6 = space();
    			label1 = element("label");
    			label1.textContent = "Or, if you have a code for a custom Sudoku puzzle, enter it here:";
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			div2 = element("div");
    			button = element("button");
    			t10 = text("Start");
    			attr_dev(h1, "class", "text-3xl font-semibold mb-6 leading-none");
    			add_location(h1, file$j, 26, 0, 677);
    			attr_dev(label0, "for", "difficulty");
    			attr_dev(label0, "class", "text-lg mb-3");
    			add_location(label0, file$j, 34, 0, 974);
    			attr_dev(select, "id", "difficulty");
    			attr_dev(select, "class", "btn btn-small w-full appearance-none leading-normal");
    			select.disabled = /*enteredSencode*/ ctx[3];
    			if (/*difficulty*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[7].call(select));
    			add_location(select, file$j, 37, 1, 1108);
    			attr_dev(path, "d", "M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z");
    			add_location(path, file$j, 45, 3, 1598);
    			attr_dev(svg, "class", "fill-current h-4 w-4");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			add_location(svg, file$j, 44, 2, 1505);
    			attr_dev(div0, "class", "pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700");
    			add_location(div0, file$j, 43, 1, 1405);
    			attr_dev(div1, "class", "inline-block relative mb-6");
    			add_location(div1, file$j, 36, 0, 1066);
    			attr_dev(label1, "for", "sencode");
    			attr_dev(label1, "class", "text-lg mb-3");
    			add_location(label1, file$j, 50, 0, 1711);
    			attr_dev(input, "id", "sencode");
    			attr_dev(input, "class", "input font-mono mb-5");
    			attr_dev(input, "type", "text");
    			add_location(input, file$j, 52, 0, 1828);
    			attr_dev(button, "class", "btn btn-small btn-primary");
    			button.disabled = /*buttonDisabled*/ ctx[4];
    			add_location(button, file$j, 55, 1, 1944);
    			attr_dev(div2, "class", "flex justify-end");
    			add_location(div2, file$j, 54, 0, 1912);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, label0, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*difficulty*/ ctx[1]);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, label1, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*sencode*/ ctx[2]);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, button);
    			append_dev(button, t10);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[7]),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(button, "click", /*handleStart*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*data*/ ctx[0].sencode) {
    				if (if_block) ; else {
    					if_block = create_if_block$9(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*Object, DIFFICULTIES*/ 0) {
    				each_value = Object.entries(DIFFICULTIES);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*enteredSencode*/ 8) {
    				prop_dev(select, "disabled", /*enteredSencode*/ ctx[3]);
    			}

    			if (dirty & /*difficulty, Object, DIFFICULTIES*/ 2) {
    				select_option(select, /*difficulty*/ ctx[1]);
    			}

    			if (dirty & /*sencode*/ 4 && input.value !== /*sencode*/ ctx[2]) {
    				set_input_value(input, /*sencode*/ ctx[2]);
    			}

    			if (dirty & /*buttonDisabled*/ 16) {
    				prop_dev(button, "disabled", /*buttonDisabled*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(label1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let enteredSencode;
    	let buttonDisabled;
    	let $difficultyStore;
    	validate_store(difficulty, 'difficultyStore');
    	component_subscribe($$self, difficulty, $$value => $$invalidate(9, $difficultyStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Welcome', slots, []);
    	let { data = {} } = $$props;
    	let { hideModal } = $$props;
    	let difficulty$1 = $difficultyStore;
    	let sencode = data.sencode || '';

    	function handleStart() {
    		if (validateSencode(sencode)) {
    			startCustom(sencode);
    		} else {
    			startNew(difficulty$1);
    		}

    		hideModal();
    	}

    	const writable_props = ['data', 'hideModal'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Welcome> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		difficulty$1 = select_value(this);
    		$$invalidate(1, difficulty$1);
    	}

    	function input_input_handler() {
    		sencode = this.value;
    		$$invalidate(2, sencode);
    	}

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('hideModal' in $$props) $$invalidate(6, hideModal = $$props.hideModal);
    	};

    	$$self.$capture_state = () => ({
    		difficultyStore: difficulty,
    		startNew,
    		startCustom,
    		validateSencode,
    		DIFFICULTIES,
    		data,
    		hideModal,
    		difficulty: difficulty$1,
    		sencode,
    		handleStart,
    		enteredSencode,
    		buttonDisabled,
    		$difficultyStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('hideModal' in $$props) $$invalidate(6, hideModal = $$props.hideModal);
    		if ('difficulty' in $$props) $$invalidate(1, difficulty$1 = $$props.difficulty);
    		if ('sencode' in $$props) $$invalidate(2, sencode = $$props.sencode);
    		if ('enteredSencode' in $$props) $$invalidate(3, enteredSencode = $$props.enteredSencode);
    		if ('buttonDisabled' in $$props) $$invalidate(4, buttonDisabled = $$props.buttonDisabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sencode*/ 4) {
    			 $$invalidate(3, enteredSencode = sencode.trim().length !== 0);
    		}

    		if ($$self.$$.dirty & /*enteredSencode, sencode, difficulty*/ 14) {
    			 $$invalidate(4, buttonDisabled = enteredSencode
    			? !validateSencode(sencode)
    			: !DIFFICULTIES.hasOwnProperty(difficulty$1));
    		}
    	};

    	return [
    		data,
    		difficulty$1,
    		sencode,
    		enteredSencode,
    		buttonDisabled,
    		handleStart,
    		hideModal,
    		select_change_handler,
    		input_input_handler
    	];
    }

    class Welcome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { data: 0, hideModal: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Welcome",
    			options,
    			id: create_fragment$j.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hideModal*/ ctx[6] === undefined && !('hideModal' in props)) {
    			console.warn("<Welcome> was created without expected prop 'hideModal'");
    		}
    	}

    	get data() {
    		throw new Error("<Welcome>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Welcome>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideModal() {
    		throw new Error("<Welcome>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideModal(value) {
    		throw new Error("<Welcome>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Modal/Types/GameOver.svelte generated by Svelte v3.49.0 */
    const file$k = "src/components/Modal/Types/GameOver.svelte";

    function create_fragment$k(ctx) {
    	let div0;
    	let svg0;
    	let path0;
    	let t0;
    	let h1;
    	let t2;
    	let div16;
    	let div5;
    	let div1;
    	let svg1;
    	let path1;
    	let t3;
    	let div4;
    	let div2;
    	let t5;
    	let div3;
    	let t6;
    	let t7;
    	let div10;
    	let div6;
    	let svg2;
    	let path2;
    	let t8;
    	let div9;
    	let div7;
    	let t10;
    	let div8;

    	let t11_value = (/*$difficulty*/ ctx[1] === DIFFICULTY_CUSTOM
    	? 'Custom'
    	: DIFFICULTIES[/*$difficulty*/ ctx[1]]) + "";

    	let t11;
    	let t12;
    	let div15;
    	let div11;
    	let svg3;
    	let path3;
    	let t13;
    	let div14;
    	let div12;
    	let t15;
    	let div13;
    	let t16;
    	let t17;
    	let button0;
    	let t19;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = `${/*gameOverCelebration*/ ctx[3]}`;
    			t2 = space();
    			div16 = element("div");
    			div5 = element("div");
    			div1 = element("div");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t3 = space();
    			div4 = element("div");
    			div2 = element("div");
    			div2.textContent = "Time:";
    			t5 = space();
    			div3 = element("div");
    			t6 = text(/*$timer*/ ctx[0]);
    			t7 = space();
    			div10 = element("div");
    			div6 = element("div");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t8 = space();
    			div9 = element("div");
    			div7 = element("div");
    			div7.textContent = "Difficulty:";
    			t10 = space();
    			div8 = element("div");
    			t11 = text(t11_value);
    			t12 = space();
    			div15 = element("div");
    			div11 = element("div");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t13 = space();
    			div14 = element("div");
    			div12 = element("div");
    			div12.textContent = "Hints used:";
    			t15 = space();
    			div13 = element("div");
    			t16 = text(/*$usedHints*/ ctx[2]);
    			t17 = space();
    			button0 = element("button");
    			button0.textContent = "Share this Sudoku puzzle";
    			t19 = space();
    			button1 = element("button");
    			button1.textContent = "New Game";
    			attr_dev(path0, "d", "M1 6.417c0-1.013.822-1.833 1.834-1.833 1.215 0 2.104 1.167 1.763 2.329-.559 1.915 5.827 3.731 6.771-1.471.239-1.323-.021-1.67-.668-2.321-.329-.329-.534-.783-.534-1.287 0-1.013.822-1.834 1.834-1.834 1.014 0 1.833.821 1.833 1.833 0 .504-.204.958-.533 1.287-.646.65-.905.998-.666 2.321.941 5.2 7.33 3.387 6.77 1.471-.339-1.162.548-2.329 1.764-2.329 1.012 0 1.832.821 1.832 1.834 0 1.118-.992 1.97-2.084 1.816-1.32-.187-3.03 4.554-3.417 6.716-1.765-.615-3.618-.942-5.493-.949-1.875.006-3.74.334-5.504.949-.388-2.162-2.098-6.903-3.418-6.717-1.092.155-2.084-.697-2.084-1.815zm-1 14.583h2.359l.566 3c.613-1.012 1.388-1.912 2.277-2.68l-2.342-3.335c-1.089.879-2.053 1.848-2.86 3.015zm24 0h-2.359l-.566 3c-.613-1.012-1.388-1.912-2.277-2.68l2.343-3.335c1.088.879 2.052 1.848 2.859 3.015zm-12-4.998c-2.845.009-5.491.825-7.757 2.211l2.334 3.322c1.603-.924 3.448-1.464 5.423-1.473 1.975.009 3.82.549 5.423 1.473l2.334-3.322c-2.266-1.386-4.912-2.202-7.757-2.211zm-3.022 3.498l-.65-.348-.651.348.131-.726-.531-.511.729-.101.321-.662.322.663.729.101-.53.511.13.725zm3.672-.5l-.65-.348-.65.348.131-.726-.531-.511.729-.101.321-.662.322.663.729.101-.53.511.129.725zm3.718.5l-.65-.348-.65.348.131-.726-.531-.511.729-.101.322-.663.322.663.729.101-.53.511.128.726z");
    			add_location(path0, file$k, 21, 2, 818);
    			attr_dev(svg0, "class", "h-32 w-32 fill-current");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			add_location(svg0, file$k, 20, 1, 724);
    			attr_dev(h1, "class", "text-4xl font-semibold");
    			add_location(h1, file$k, 24, 1, 2083);
    			attr_dev(div0, "class", "flex flex-col text-center items-center");
    			add_location(div0, file$k, 19, 0, 670);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			attr_dev(path1, "d", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z");
    			add_location(path1, file$k, 31, 4, 2366);
    			attr_dev(svg1, "class", "icon-outline");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file$k, 30, 3, 2246);
    			attr_dev(div1, "class", "item-icon svelte-4obka2");
    			add_location(div1, file$k, 29, 2, 2219);
    			attr_dev(div2, "class", "item-data-label svelte-4obka2");
    			add_location(div2, file$k, 36, 3, 2536);
    			attr_dev(div3, "class", "item-data-value svelte-4obka2");
    			add_location(div3, file$k, 40, 3, 2590);
    			attr_dev(div4, "class", "item-data svelte-4obka2");
    			add_location(div4, file$k, 35, 2, 2509);
    			attr_dev(div5, "class", "game-data-item svelte-4obka2");
    			add_location(div5, file$k, 28, 1, 2188);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2");
    			attr_dev(path2, "d", "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z");
    			add_location(path2, file$k, 49, 4, 2840);
    			attr_dev(svg2, "class", "icon-outline");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke", "currentColor");
    			add_location(svg2, file$k, 48, 3, 2720);
    			attr_dev(div6, "class", "item-icon svelte-4obka2");
    			add_location(div6, file$k, 47, 2, 2693);
    			attr_dev(div7, "class", "item-data-label svelte-4obka2");
    			add_location(div7, file$k, 54, 3, 3163);
    			attr_dev(div8, "class", "item-data-value svelte-4obka2");
    			add_location(div8, file$k, 58, 3, 3223);
    			attr_dev(div9, "class", "item-data svelte-4obka2");
    			add_location(div9, file$k, 53, 2, 3136);
    			attr_dev(div10, "class", "game-data-item svelte-4obka2");
    			add_location(div10, file$k, 46, 1, 2662);
    			attr_dev(path3, "stroke-linecap", "round");
    			attr_dev(path3, "stroke-linejoin", "round");
    			attr_dev(path3, "stroke-width", "2");
    			attr_dev(path3, "d", "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z");
    			add_location(path3, file$k, 67, 4, 3539);
    			attr_dev(svg3, "class", "icon-outline");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "stroke", "currentColor");
    			add_location(svg3, file$k, 66, 3, 3419);
    			attr_dev(div11, "class", "item-icon svelte-4obka2");
    			add_location(div11, file$k, 65, 2, 3392);
    			attr_dev(div12, "class", "item-data-label svelte-4obka2");
    			add_location(div12, file$k, 72, 3, 3874);
    			attr_dev(div13, "class", "item-data-value svelte-4obka2");
    			add_location(div13, file$k, 76, 3, 3934);
    			attr_dev(div14, "class", "item-data svelte-4obka2");
    			add_location(div14, file$k, 71, 2, 3847);
    			attr_dev(div15, "class", "game-data-item svelte-4obka2");
    			add_location(div15, file$k, 64, 1, 3361);
    			attr_dev(div16, "class", "game-data space-y-2 svelte-4obka2");
    			add_location(div16, file$k, 27, 0, 2153);
    			attr_dev(button0, "class", "btn btn-small w-full mb-2");
    			add_location(button0, file$k, 83, 0, 4016);
    			attr_dev(button1, "class", "btn btn-small btn-primary w-full");
    			add_location(button1, file$k, 84, 0, 4115);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t0);
    			append_dev(div0, h1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div16, anchor);
    			append_dev(div16, div5);
    			append_dev(div5, div1);
    			append_dev(div1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, t6);
    			append_dev(div16, t7);
    			append_dev(div16, div10);
    			append_dev(div10, div6);
    			append_dev(div6, svg2);
    			append_dev(svg2, path2);
    			append_dev(div10, t8);
    			append_dev(div10, div9);
    			append_dev(div9, div7);
    			append_dev(div9, t10);
    			append_dev(div9, div8);
    			append_dev(div8, t11);
    			append_dev(div16, t12);
    			append_dev(div16, div15);
    			append_dev(div15, div11);
    			append_dev(div11, svg3);
    			append_dev(svg3, path3);
    			append_dev(div15, t13);
    			append_dev(div15, div14);
    			append_dev(div14, div12);
    			append_dev(div14, t15);
    			append_dev(div14, div13);
    			append_dev(div13, t16);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handleShare*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*handleNewGame*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$timer*/ 1) set_data_dev(t6, /*$timer*/ ctx[0]);

    			if (dirty & /*$difficulty*/ 2 && t11_value !== (t11_value = (/*$difficulty*/ ctx[1] === DIFFICULTY_CUSTOM
    			? 'Custom'
    			: DIFFICULTIES[/*$difficulty*/ ctx[1]]) + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*$usedHints*/ 4) set_data_dev(t16, /*$usedHints*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div16);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $timer;
    	let $difficulty;
    	let $usedHints;
    	validate_store(timer, 'timer');
    	component_subscribe($$self, timer, $$value => $$invalidate(0, $timer = $$value));
    	validate_store(difficulty, 'difficulty');
    	component_subscribe($$self, difficulty, $$value => $$invalidate(1, $difficulty = $$value));
    	validate_store(usedHints, 'usedHints');
    	component_subscribe($$self, usedHints, $$value => $$invalidate(2, $usedHints = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GameOver', slots, []);
    	const gameOverCelebration = GAME_OVER_CELEBRATIONS[Math.floor(Math.random() * GAME_OVER_CELEBRATIONS.length)];

    	function handleShare() {
    		modal.show('share', {
    			onHide: () => modal.show('gameover'),
    			onHideReplace: true
    		});
    	}

    	function handleNewGame() {
    		modal.show('welcome', { onHide: resumeGame });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GameOver> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		DIFFICULTIES,
    		DIFFICULTY_CUSTOM,
    		GAME_OVER_CELEBRATIONS,
    		resumeGame,
    		modal,
    		timer,
    		difficulty,
    		usedHints,
    		gameOverCelebration,
    		handleShare,
    		handleNewGame,
    		$timer,
    		$difficulty,
    		$usedHints
    	});

    	return [
    		$timer,
    		$difficulty,
    		$usedHints,
    		gameOverCelebration,
    		handleShare,
    		handleNewGame
    	];
    }

    class GameOver extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameOver",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    var types = {
    	share: Share,
    	qrcode: QRCode,
    	settings: Settings,
    	confirm: Confirm,
    	prompt: Prompt,
    	welcome: Welcome,
    	gameover: GameOver
    };

    /* src/components/Modal/index.svelte generated by Svelte v3.49.0 */
    const file$l = "src/components/Modal/index.svelte";

    // (16:0) {#if $modal !== MODAL_NONE}
    function create_if_block$a(ctx) {
    	let div2;
    	let button;
    	let button_transition;
    	let t;
    	let div1;
    	let div0;
    	let switch_instance;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = types[/*$modal*/ ctx[0]];

    	function switch_props(ctx) {
    		return {
    			props: {
    				data: /*$modalData*/ ctx[1],
    				hideModal: modal.hide
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			button = element("button");
    			t = space();
    			div1 = element("div");
    			div0 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(button, "class", "modal-overlay svelte-acw4n8");
    			attr_dev(button, "tabindex", "-1");
    			add_location(button, file$l, 17, 2, 442);
    			attr_dev(div0, "class", "modal-content svelte-acw4n8");
    			add_location(div0, file$l, 20, 3, 653);
    			attr_dev(div1, "class", "modal-container svelte-acw4n8");
    			add_location(div1, file$l, 19, 2, 574);
    			attr_dev(div2, "class", "modal svelte-acw4n8");
    			add_location(div2, file$l, 16, 1, 420);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, button);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			if (switch_instance) {
    				mount_component(switch_instance, div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleOverlayClick*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const switch_instance_changes = {};
    			if (dirty & /*$modalData*/ 2) switch_instance_changes.data = /*$modalData*/ ctx[1];

    			if (switch_value !== (switch_value = types[/*$modal*/ ctx[0]])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div0, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: MODAL_DURATION }, true);
    				button_transition.run(1);
    			});

    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, scale, { duration: MODAL_DURATION }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: MODAL_DURATION }, false);
    			button_transition.run(0);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, scale, { duration: MODAL_DURATION }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && button_transition) button_transition.end();
    			if (switch_instance) destroy_component(switch_instance);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(16:0) {#if $modal !== MODAL_NONE}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$modal*/ ctx[0] !== MODAL_NONE && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$modal*/ ctx[0] !== MODAL_NONE) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$modal*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let $modal;
    	let $modalData;
    	validate_store(modal, 'modal');
    	component_subscribe($$self, modal, $$value => $$invalidate(0, $modal = $$value));
    	validate_store(modalData, 'modalData');
    	component_subscribe($$self, modalData, $$value => $$invalidate(1, $modalData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Modal', slots, []);
    	const MODALS_DISABLED_OVERLAY = ['welcome', 'gameover'];

    	function handleOverlayClick() {
    		if (!MODALS_DISABLED_OVERLAY.includes($modal)) {
    			modal.hide();
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fade,
    		scale,
    		modal,
    		modalData,
    		MODAL_NONE,
    		MODAL_DURATION,
    		types,
    		MODALS_DISABLED_OVERLAY,
    		handleOverlayClick,
    		$modal,
    		$modalData
    	});

    	return [$modal, $modalData, handleOverlayClick];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.49.0 */
    const file$m = "src/App.svelte";

    function create_fragment$m(ctx) {
    	let header1;
    	let header0;
    	let t0;
    	let section;
    	let board;
    	let t1;
    	let footer;
    	let controls;
    	let t2;
    	let modal_1;
    	let current;
    	header0 = new Header({ $$inline: true });
    	board = new Board({ $$inline: true });
    	controls = new Controls({ $$inline: true });
    	modal_1 = new Modal({ $$inline: true });

    	const block = {
    		c: function create() {
    			header1 = element("header");
    			create_component(header0.$$.fragment);
    			t0 = space();
    			section = element("section");
    			create_component(board.$$.fragment);
    			t1 = space();
    			footer = element("footer");
    			create_component(controls.$$.fragment);
    			t2 = space();
    			create_component(modal_1.$$.fragment);
    			add_location(header1, file$m, 38, 0, 989);
    			add_location(section, file$m, 43, 0, 1043);
    			add_location(footer, file$m, 48, 0, 1094);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header1, anchor);
    			mount_component(header0, header1, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			mount_component(board, section, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, footer, anchor);
    			mount_component(controls, footer, null);
    			insert_dev(target, t2, anchor);
    			mount_component(modal_1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header0.$$.fragment, local);
    			transition_in(board.$$.fragment, local);
    			transition_in(controls.$$.fragment, local);
    			transition_in(modal_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header0.$$.fragment, local);
    			transition_out(board.$$.fragment, local);
    			transition_out(controls.$$.fragment, local);
    			transition_out(modal_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header1);
    			destroy_component(header0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    			destroy_component(board);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(footer);
    			destroy_component(controls);
    			if (detaching) detach_dev(t2);
    			destroy_component(modal_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	gameWon.subscribe(won => {
    		if (won) {
    			game.pause();
    			modal.show('gameover');
    			branchBackManager.getBranchBackTimes().set(0);
    			branchBackManager.resetBranchBackSteps();
    		}
    	});

    	onMount(() => {
    		let hash = location.hash;

    		if (hash.startsWith('#')) {
    			hash = hash.slice(1);
    		}

    		let sencode;

    		if (validateSencode(hash)) {
    			sencode = hash;
    		}

    		modal.show('welcome', { onHide: game.resume, sencode });
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		validateSencode,
    		game,
    		modal,
    		gameWon,
    		branchBackManager,
    		Board,
    		Controls,
    		Header,
    		Modal
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    const app = new App({
    	target: document.getElementById('app')
    });


    // TODO: Warn when hint not possible
    // TODO: Undo/Redo
    // TODO: Import sudoku
    // TODO: Creator mode
    // TODO: Bug hunt
    // TODO: Announce

    return app;

}());
//# sourceMappingURL=bundle.js.map
