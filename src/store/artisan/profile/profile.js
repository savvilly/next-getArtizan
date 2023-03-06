// Utilities
import { db } from '@/plugins/firebase'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"

import { useAppStore } from '../../app'

const snackbar = useAppStore()

export const useProfileStore = defineStore('profile', {
    state: () => ({
        user: null,
        file: null,
        gender: 'Male',
        stateOfResidence: '',
        LGA: '',
        specialisation: '',
        guarantorName: '',
        guarantorPhone: '',
        loading: false
    }),

    actions: {
        async getProfile() {
            const userData = await JSON.parse(localStorage.getItem('getArtizanUserData'))

            // Get profile from real time from firestore
            const unsub = onSnapshot(doc(db, 'artisan', userData.uid), (doc) => {
                this.user = doc.data()

                this.gender = doc.get('gender')
                this.stateOfResidence = doc.get('stateOfResidence')
                this.LGA = doc.get('LGA')
                this.specialisation = doc.get('specialisation')
                this.guarantorName = doc.get('guarantorName')
                this.guarantorPhone = doc.get('guarantorPhone')
            })
            return unsub
        },

        updateAvatar() {
            if (!this.file) return

            let file = this.file.target.files[0]

            const storage = getStorage()

            let link = `avatars/${this.user.uid}/${file.name}`

            const storageRef = ref(storage, link)

            const uploadTask = uploadBytesResumable(storageRef, file)

            const upload = () => {
                uploadTask.on('state_changed', snapshot => { },
                    error => { },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref)
                            .then(downloadURL => {
                                updateDoc(doc(db, 'artisan', this.user.uid), {
                                    avatar: downloadURL,
                                    avatarLink: uploadTask.snapshot.ref.fullPath
                                })
                            })
                    })
            }


            if (this.user.avatar == undefined || this.user.avatar == null) {
                upload()
            } else {
                const desertRef = ref(storage, this.user.avatarLink)

                // Delete the file
                deleteObject(desertRef)
                    .then(() => {
                        upload()
                    }).catch((error) => {
                        console.log(error)
                        // Uh-oh, an error occurred!
                    });
            }
        },

        async updateProfile() {
            this.loading = true

            await updateDoc(doc(db, 'artisan', this.user.uid), {
                gender: this.gender,
                stateOfResidence: this.stateOfResidence,
                LGA: this.LGA,
                specialisation: this.specialisation,
                guarantorName: this.guarantorName,
                guarantorPhone: this.guarantorPhone,
            })

            this.loading = false

            snackbar.snackbar = true
            snackbar.snackbarText = 'Profile update succesful'
            snackbar.snackbarColor = 'green'
        }
    }
})
