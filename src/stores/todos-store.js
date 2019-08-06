import { writable } from 'svelte/store';
import { routerStore, routerToIndex } from '../stores/router-store.js'
import { authStore } from '../stores/auth-store.js'

export const todosStore = writable({
	json: {},
	array: []
})

let listener


export function todosStoreInit() {
	setListener()
}

function setListener() {
	authStore.subscribe(authData => {
		if(listener) {
			listener()
		}

		if(authData.hasAuth) {
			listener = firebase.db.collection('todos').where('user', '==', authData.user.id).onSnapshot(snapshot =>
				snapshot.docChanges().forEach(change => {
								
					if (change.type === 'added' || change.type === 'modified') {

						const todoData = Object.assign({ 
							id: change.doc.id 
						}, change.doc.data())

						todosStore.update(data => {
							data.json[todoData.id] = todoData
							data.array = (Object.keys(data.json).map(el => data.json[el])).sort((a, b) => 
								(b.updated ? b.updated.toDate() : 0) - (a.updated ? a.updated.toDate() : 0)
							)
							return data
						})
					} else if (change.type === 'removed') {
						todosStore.update(data => {
							delete data.json[change.doc.id]
							data.array = (Object.keys(data.json).map(el => data.json[el])).sort((a, b) => 
								(b.updated ? b.updated.toDate() : 0) - (a.updated ? a.updated.toDate() : 0)
							)
							return data
						})
					}
				})
			)
		}
	})
}


export function todosStoreNewTodo(cb) {

	const unsubscribe = authStore.subscribe(authData => {
		firebase.db.collection('todos').doc().set({
			user: authData.user.id,
			todo: '',
			done: false,
			updated: new Date(),
			created: new Date()
		})
	})
	unsubscribe()
}


export function todosStoreChangeTodo(id, todo, done) {
	firebase.db.collection('todos').doc(id).update({
		todo,
		done,
		excerpt: getExcerpt(todo),
		updated: new Date()
	})
}

export function todosStoreDeleteTodo(id) {
	routerToIndex()
	firebase.db.collection('todos').doc(id).delete()
}